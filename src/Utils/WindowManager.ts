import { toggleDialogWindowVisibility } from "@/Scripts/WINDOW/WINDOW.DialogHider";
import { EMBEDDED_WEB_DIALOG_CLOSE, openWebEmbeddedDialog } from "@/Utils/WebEmbeddedDialog";
import $ from "jquery";

export { getWebDialogPostMessageTarget, isEmbeddedDialog } from "@/Utils/WebEmbeddedDialog";

function isMobilePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/android|iphone|ipod|ipad|iemobile|webos|blackberry|opera mini/i.test(ua)) {
    return true;
  }
  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
  return uaData?.mobile === true;
}

function applyEmbeddedWindowChrome() {
  $(() => {
    $("#app-main-title-bar").hide();
    $(".window").css({
      boxShadow: "none",
      border: "none",
      padding: "0",
      borderColor: "transparent",
    });
    $(".menu-bar").css({
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      height: "20px",
      zIndex: "99999999",
    });
    $(".window-body").css({
      margin: "0",
    });
    window.dispatchEvent(new Event("resize"));
  });
}

export async function setupWindowBehavior() {
  if ("__TAURI_INTERNALS__" in window) {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const tWindow = getCurrentWindow();
    window.tWindow = tWindow;

    if (isMobilePlatform()) {
      applyEmbeddedWindowChrome();
      return tWindow;
    }

    await tWindow.listen("tauri://blur", () => {
      document.getElementById("app-main-title-bar")?.classList.add("inactive");
    });
    await tWindow.listen("tauri://focus", () => {
      document.getElementById("app-main-title-bar")?.classList.remove("inactive");
    });

    return tWindow;
  } else {
    applyEmbeddedWindowChrome();
  }
  return null;
}

export async function closeCurrentWindow() {
  const w = window as Window & { __ALIVE_EMBEDDED_DIALOG__?: boolean; __ALIVE_EMBEDDED_DIALOG_ID__?: string };
  if (w.__ALIVE_EMBEDDED_DIALOG__ && window.parent !== window && w.__ALIVE_EMBEDDED_DIALOG_ID__) {
    window.parent.postMessage({ type: EMBEDDED_WEB_DIALOG_CLOSE, id: w.__ALIVE_EMBEDDED_DIALOG_ID__ }, "*");
    return;
  }
  if ("__TAURI_INTERNALS__" in window) {
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

export async function openDialog(
  id: string,
  url: string,
  title: string,
  width: number,
  height: number,
  browserWidth: number = width,
  browserHeight: number = height
) {
  if ("__TAURI_INTERNALS__" in window && !isMobilePlatform()) {
    try {
      const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");

      const existing = await WebviewWindow.getByLabel(id);
      if (existing) {
        await existing.show();
        await existing.setFocus();
        return;
      }

      const webview = new WebviewWindow(id, {
        url,
        title,
        width,
        height,
        decorations: false,
        shadow: true,
        resizable: false,
        maximizable: false,
        minimizable: false,
      });
      await webview.once("tauri://error", function (e) {
        console.error("Failed to open dialog with Tauri WebviewWindow", e);
        const win = window.open(
          url,
          id,
          `width=${browserWidth},height=${browserHeight},toolbar=0,menubar=0,location=0,status=0,scrollbars=0,resizable=0`
        );
        if (win) win.focus();
      });
    } catch (e) {
      console.error("Failed to open dialog with Tauri WebviewWindow 2", e);
      const win = window.open(
        url,
        id,
        `width=${browserWidth},height=${browserHeight},toolbar=0,menubar=0,location=0,status=0,scrollbars=0,resizable=0`
      );
      if (win) win.focus();
    }
  } else {
    openWebEmbeddedDialog(id, url, title, browserWidth, browserHeight);
  }
}

export async function initWindowManager() {
  const tWindow = await setupWindowBehavior();
  if (tWindow) {
    await tWindow.listen("tauri://resize", async () => {
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
    await openDialog(
      "settings",
      "/dialogs/settings.html",
      "Alive renewal 设置",
      480,
      500,
      480,
      420
    );
  };

  window.toggleBacklog = () => {
    document.dispatchEvent(new CustomEvent("toggleBacklog", { bubbles: true }));
  };

  window.toggleDialogWindowVisibility = toggleDialogWindowVisibility;

  window.openSaveLoadDialog = (mode: "save" | "load") => {
    return new Promise((resolve) => {
      const url = `/dialogs/save_load.html?mode=${mode}`;
      if ("__TAURI_INTERNALS__" in window && !isMobilePlatform()) {
        import("@tauri-apps/api/event").then(({ listen }) => {
          let unlistenClose: () => void;
          let unlistenAction: () => void;

          const cleanup = () => {
            if (unlistenClose) unlistenClose();
            if (unlistenAction) unlistenAction();
          };

          listen("save-load-closed", () => {
            cleanup();
            resolve(null);
          }).then((u) => (unlistenClose = u));

          listen("save-load-action", (event: any) => {
            cleanup();
            if (event.payload.mode === mode) {
              if (mode === "save") {
                localStorage.setItem("_temp_save_comment", event.payload.comment || "");
              }
              resolve(event.payload.slotIndex);
            } else {
              resolve(null);
            }
          }).then((u) => (unlistenAction = u));

          openDialog("save_load", url, "Save/Load", 450, 600);
        });
      } else {
        const messageHandler = (event: MessageEvent) => {
          if (event.data.type === "save-load-action") {
            window.removeEventListener("message", messageHandler);
            if (event.data.mode === mode) {
              if (mode === "save") {
                localStorage.setItem("_temp_save_comment", event.data.comment || "");
              }
              resolve(event.data.slotIndex);
            } else {
              resolve(null);
            }
          } else if (event.data.type === "save-load-closed") {
            window.removeEventListener("message", messageHandler);
            resolve(null);
          }
        };
        window.addEventListener("message", messageHandler);
        openDialog("save_load", url, "Save/Load", 450, 520);
      }
    });
  };

  window.exit = (timeout: number = 600) => {
    $("#black-overlay").fadeIn(timeout, async () => {
      window.tWindow?.close() || window.close();
    });
  };

  window.minimize = () => {
    window.tWindow?.minimize();
  };

  window.toggleMaximize = () => {
    window.tWindow?.toggleMaximize();
  };
}
