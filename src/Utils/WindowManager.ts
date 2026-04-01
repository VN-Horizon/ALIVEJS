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

export async function initWindowManager() {
  const tWindow = await setupWindowBehavior();
  if (tWindow) {
    tWindow.listen('tauri://resize', async () => {
      const isMaximized = await tWindow.isMaximized();
      $("#toggleMaximizeBtn").attr("aria-label", isMaximized ? "Restore" : "Maximize");
    });
  }

  window.openVersionInfo = async () => {
    if ('__TAURI_INTERNALS__' in window) {
      try {
        const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
        const webview = new WebviewWindow("version-info", {
          url: "/dialogs/version.html",
          title: "ALIVE Renewal",
          width: 450,
          height: 250,
          decorations: false,
          transparent: true,
          resizable: false,
          maximizable: false,
          center: true
        });
        webview.once("tauri://error", function () {
          window.open("/dialogs/version.html", "version-info", "width=450,height=250,toolbar=0,menubar=0,location=0,status=0,scrollbars=0,resizable=0");
        });
      } catch (e) {
        window.open("/dialogs/version.html", "version-info", "width=450,height=250,toolbar=0,menubar=0,location=0,status=0,scrollbars=0,resizable=0");
      }
    } else {
      window.open("/dialogs/version.html", "version-info", "width=450,height=250,toolbar=0,menubar=0,location=0,status=0,scrollbars=0,resizable=0");
    }
  };

  window.openCodecVersionInfo = async () => {
    if ('__TAURI_INTERNALS__' in window) {
      try {
        const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
        const webview = new WebviewWindow("codec-version", {
          url: "/dialogs/codec-version.html",
          title: "Codec Information",
          width: 450,
          height: 310,
          decorations: false,
          transparent: true,
          resizable: false,
          maximizable: false,
          center: true
        });
        webview.once("tauri://error", function () {
          window.open("/dialogs/codec-version.html", "codec-version", "width=450,height=310,toolbar=0,menubar=0,location=0,status=0,scrollbars=0,resizable=0");
        });
      } catch (e) {
        window.open("/dialogs/codec-version.html", "codec-version", "width=450,height=310,toolbar=0,menubar=0,location=0,status=0,scrollbars=0,resizable=0");
      }
    } else {
      window.open("/dialogs/codec-version.html", "codec-version", "width=450,height=310,toolbar=0,menubar=0,location=0,status=0,scrollbars=0,resizable=0");
    }
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
