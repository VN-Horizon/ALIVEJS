import $ from "jquery";

export async function setupWindowBehavior() {
  if ('__TAURI_INTERNALS__' in window) {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const tWindow = getCurrentWindow();
    window.tWindow = tWindow;
    
    tWindow.listen('tauri://blur', () => {
      document.querySelectorAll('.title-bar').forEach(el => el.classList.add('inactive'));
    });
    tWindow.listen('tauri://focus', () => {
      document.querySelectorAll('.title-bar').forEach(el => el.classList.remove('inactive'));
    });
    
    return tWindow;
  } else {
    $(() => {
      $(".title-bar").hide();
      $(".window").css({
        boxShadow: "none",
        border: "none"
      });
      window.dispatchEvent(new Event("resize"));
    });
  }
  return null;
}

export async function closeCurrentWindow() {
  if ('__TAURI_INTERNALS__' in window) {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().close();
      return;
    } catch (e) {
      console.error(e);
    }
  }
  window.close();
}

export async function openDialog(id: string, url: string, title: string, width: number, height: number, browserWidth: number = width, browserHeight: number = height) {
  if ('__TAURI_INTERNALS__' in window) {
    try {
      const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
      const webview = new WebviewWindow(id, {
        url,
        title,
        width,
        height,
        decorations: false,
        transparent: true,
        resizable: false,
        maximizable: false,
        center: true
      });
      webview.once("tauri://error", function () {
        window.open(url, id, `width=${browserWidth},height=${browserHeight},toolbar=0,menubar=0,location=0,status=0,scrollbars=0,resizable=0`);
      });
    } catch (e) {
      window.open(url, id, `width=${browserWidth},height=${browserHeight},toolbar=0,menubar=0,location=0,status=0,scrollbars=0,resizable=0`);
    }
  } else {
    window.open(url, id, `width=${browserWidth},height=${browserHeight},toolbar=0,menubar=0,location=0,status=0,scrollbars=0,resizable=0`);
  }
}

export async function initWindowManager() {
  const tWindow = await setupWindowBehavior();
  if (tWindow) {
    tWindow.listen('tauri://resize', async () => {
      const isMaximized = await tWindow.isMaximized();
      $("#toggleMaximizeBtn").attr("aria-label", isMaximized ? "Restore" : "Maximize");
    });
  }

  window.openVersionInfo = async () => {
    await openDialog("version-info", "/dialogs/version.html", "ALIVE Renewal", 450, 250);
  };

  window.openCodecVersionInfo = async () => {
    await openDialog("codec-version", "/dialogs/codec-version.html", "Codec Information", 450, 310);
  };

  window.openSettings = async () => {
    await openDialog("settings", "/dialogs/settings.html", "Alive renewal的设置属性", 480, 520, 480, 420);
  };

  window.exit = (timeout: number=600) => {
    $("#black-overlay").fadeIn(timeout, async () => {
      window.tWindow?.close() || window.close();
    });
  };

  window.minimize = () => {
    window.tWindow?.minimize()
  };

  window.toggleMaximize = () => {
    window.tWindow?.toggleMaximize();
  };
}
