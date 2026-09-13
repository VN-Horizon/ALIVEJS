use tauri::WebviewWindow;

#[cfg(windows)]
mod win {
    use std::sync::Mutex;
    use std::time::Duration;

    use tauri::WebviewWindow;
    use windows::Win32::Foundation::{HWND, LPARAM, RECT, TRUE};
    use windows::Win32::Graphics::Gdi::{
        GetMonitorInfoW, MonitorFromWindow, MONITORINFO, MONITOR_DEFAULTTONEAREST,
    };
    use windows::Win32::UI::WindowsAndMessaging::{
        EnumChildWindows, GetClientRect, GetWindowLongPtrW, GetWindowPlacement, SetWindowLongPtrW,
        SetWindowPlacement, SetWindowPos, GWL_EXSTYLE, GWL_STYLE, HWND_TOP, SWP_FRAMECHANGED,
        SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOOWNERZORDER, SWP_NOSIZE, SWP_NOZORDER, WINDOWPLACEMENT,
        WS_CAPTION, WS_MAXIMIZE, WS_MAXIMIZEBOX, WS_MINIMIZE, WS_MINIMIZEBOX, WS_OVERLAPPEDWINDOW,
        WS_POPUP, WS_SYSMENU, WS_THICKFRAME, WS_VISIBLE, WS_EX_CLIENTEDGE, WS_EX_COMPOSITED,
        WS_EX_DLGMODALFRAME, WS_EX_LAYERED, WS_EX_STATICEDGE, WS_EX_TRANSPARENT, WS_EX_WINDOWEDGE,
    };

    const WS_EX_NOREDIRECTIONBITMAP: u32 = 0x0020_0000;

    const STYLE_CLEAR: u32 = WS_OVERLAPPEDWINDOW.0
        | WS_CAPTION.0
        | WS_THICKFRAME.0
        | WS_MINIMIZE.0
        | WS_MAXIMIZE.0
        | WS_SYSMENU.0
        | WS_MINIMIZEBOX.0
        | WS_MAXIMIZEBOX.0;

    const EXSTYLE_CLEAR: u32 = WS_EX_DLGMODALFRAME.0
        | WS_EX_WINDOWEDGE.0
        | WS_EX_CLIENTEDGE.0
        | WS_EX_STATICEDGE.0
        | WS_EX_TRANSPARENT.0
        | WS_EX_LAYERED.0
        | WS_EX_COMPOSITED.0
        | WS_EX_NOREDIRECTIONBITMAP;

    struct Saved {
        style: isize,
        ex_style: isize,
        placement: WINDOWPLACEMENT,
    }

    static SAVED: Mutex<Option<Saved>> = Mutex::new(None);

    pub fn is_active() -> bool {
        SAVED.lock().ok().is_some_and(|g| g.is_some())
    }

    unsafe extern "system" fn fit_child(child: HWND, lparam: LPARAM) -> windows::core::BOOL {
        let rect = unsafe { *(lparam.0 as *const RECT) };
        let _ = unsafe {
            SetWindowPos(
                child,
                Some(HWND_TOP),
                0,
                0,
                rect.right - rect.left,
                rect.bottom - rect.top,
                SWP_NOZORDER | SWP_NOACTIVATE,
            )
        };
        TRUE
    }

    fn fit_webview(hwnd: HWND) {
        let mut rect = RECT::default();
        unsafe {
            if GetClientRect(hwnd, &mut rect).is_err() {
                return;
            }
            let _ = EnumChildWindows(Some(hwnd), Some(fit_child), LPARAM(&rect as *const RECT as isize));
        }
    }

    fn schedule_refit(window: &WebviewWindow) {
        for delay_ms in [16_u64, 50, 120] {
            let window = window.clone();
            std::thread::spawn(move || {
                std::thread::sleep(Duration::from_millis(delay_ms));
                let queued = window.clone();
                let _ = window.run_on_main_thread(move || {
                    if let Ok(hwnd) = queued.hwnd() {
                        fit_webview(hwnd);
                    }
                });
            });
        }
    }

    pub fn set(window: &WebviewWindow, enabled: bool) -> Result<(), String> {
        let hwnd = window.hwnd().map_err(|e| e.to_string())?;
        let _ = window.set_fullscreen(false);
        let _ = window.set_shadow(!enabled);

        if enabled {
            enter(window, hwnd)
        } else {
            exit(window, hwnd)
        }
    }

    pub fn refit(window: &WebviewWindow) -> Result<(), String> {
        if !is_active() {
            return Ok(());
        }
        let hwnd = window.hwnd().map_err(|e| e.to_string())?;
        fit_webview(hwnd);
        Ok(())
    }

    fn enter(window: &WebviewWindow, hwnd: HWND) -> Result<(), String> {
        {
            let mut guard = SAVED.lock().map_err(|e| e.to_string())?;
            if guard.is_none() {
                let mut placement = WINDOWPLACEMENT {
                    length: std::mem::size_of::<WINDOWPLACEMENT>() as u32,
                    ..Default::default()
                };
                unsafe {
                    GetWindowPlacement(hwnd, &mut placement).map_err(|e| e.to_string())?;
                }
                *guard = Some(Saved {
                    style: unsafe { GetWindowLongPtrW(hwnd, GWL_STYLE) },
                    ex_style: unsafe { GetWindowLongPtrW(hwnd, GWL_EXSTYLE) },
                    placement,
                });
            }
        }

        let mut mi = MONITORINFO {
            cbSize: std::mem::size_of::<MONITORINFO>() as u32,
            ..Default::default()
        };
        unsafe {
            let monitor = MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST);
            GetMonitorInfoW(monitor, &mut mi)
                .ok()
                .map_err(|e| e.to_string())?;

            let style = GetWindowLongPtrW(hwnd, GWL_STYLE) as u32;
            let ex_style = GetWindowLongPtrW(hwnd, GWL_EXSTYLE) as u32;
            SetWindowLongPtrW(
                hwnd,
                GWL_STYLE,
                ((style & !STYLE_CLEAR) | WS_POPUP.0 | WS_VISIBLE.0) as isize,
            );
            SetWindowLongPtrW(hwnd, GWL_EXSTYLE, (ex_style & !EXSTYLE_CLEAR) as isize);

            let rect = mi.rcMonitor;
            SetWindowPos(
                hwnd,
                Some(HWND_TOP),
                rect.left,
                rect.top,
                rect.right - rect.left,
                rect.bottom - rect.top,
                SWP_FRAMECHANGED | SWP_NOOWNERZORDER,
            )
            .map_err(|e| e.to_string())?;
        }

        fit_webview(hwnd);
        schedule_refit(window);
        Ok(())
    }

    fn exit(window: &WebviewWindow, hwnd: HWND) -> Result<(), String> {
        let saved = SAVED.lock().map_err(|e| e.to_string())?.take();
        let Some(saved) = saved else {
            return Ok(());
        };

        unsafe {
            SetWindowLongPtrW(hwnd, GWL_STYLE, saved.style);
            SetWindowLongPtrW(hwnd, GWL_EXSTYLE, saved.ex_style);
            SetWindowPlacement(hwnd, &saved.placement).map_err(|e| e.to_string())?;
            SetWindowPos(
                hwnd,
                Some(HWND_TOP),
                0,
                0,
                0,
                0,
                SWP_NOZORDER | SWP_NOMOVE | SWP_NOSIZE | SWP_FRAMECHANGED | SWP_NOOWNERZORDER,
            )
            .map_err(|e| e.to_string())?;
        }

        fit_webview(hwnd);
        schedule_refit(window);
        Ok(())
    }
}

#[tauri::command]
pub fn set_game_fullscreen(window: WebviewWindow, enabled: bool) -> Result<(), String> {
    #[cfg(windows)]
    {
        return win::set(&window, enabled);
    }
    #[cfg(not(windows))]
    {
        window.set_fullscreen(enabled).map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn is_game_fullscreen(window: WebviewWindow) -> Result<bool, String> {
    #[cfg(windows)]
    {
        let _ = window;
        return Ok(win::is_active());
    }
    #[cfg(not(windows))]
    {
        window.is_fullscreen().map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn refit_fullscreen_webview(window: WebviewWindow) -> Result<(), String> {
    #[cfg(windows)]
    {
        return win::refit(&window);
    }
    #[cfg(not(windows))]
    {
        let _ = window;
        Ok(())
    }
}
