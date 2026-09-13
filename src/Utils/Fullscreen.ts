let fullscreenActive = false;

function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window && Boolean(window.tWindow);
}

function getFullscreenElement(): Element | null {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function applyFullscreenChrome(enabled: boolean) {
  const changed = fullscreenActive !== enabled;
  fullscreenActive = enabled;
  document.documentElement.classList.toggle("app-fullscreen", enabled);
  if (changed) {
    window.dispatchEvent(new Event("resize"));
  }
}

async function requestBrowserFullscreen() {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };
  if (el.requestFullscreen) {
    await el.requestFullscreen({ navigationUI: "hide" });
    return;
  }
  await el.webkitRequestFullscreen?.();
}

async function exitBrowserFullscreen() {
  const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> | void };
  const exit = doc.exitFullscreen?.bind(doc) ?? doc.webkitExitFullscreen?.bind(doc);
  if (!exit) return;
  await exit.call(doc);
}

async function invokeFullscreen<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args);
}

export function isAppFullscreen() {
  return fullscreenActive;
}

export async function setAppFullscreen(enabled: boolean) {
  if (isTauri() && window.tWindow) {
    await invokeFullscreen("set_game_fullscreen", { enabled });
    applyFullscreenChrome(enabled);
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
      void invokeFullscreen("refit_fullscreen_webview");
    });
    return;
  }

  if (enabled) {
    if (!getFullscreenElement()) {
      await requestBrowserFullscreen();
    }
  } else if (getFullscreenElement()) {
    await exitBrowserFullscreen();
  }
}

export async function toggleFullscreen() {
  if (isTauri() && window.tWindow) {
    const enabled = await invokeFullscreen<boolean>("is_game_fullscreen");
    await setAppFullscreen(!enabled);
    return;
  }
  await setAppFullscreen(!getFullscreenElement());
}

function syncWebFullscreenChrome() {
  applyFullscreenChrome(Boolean(getFullscreenElement()));
}

async function syncTauriFullscreenChrome() {
  if (!window.tWindow) return;
  try {
    applyFullscreenChrome(await invokeFullscreen<boolean>("is_game_fullscreen"));
  } catch {
    applyFullscreenChrome(await window.tWindow.isFullscreen());
  }
}

function onFullscreenHotkey(e: KeyboardEvent) {
  if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;

  if (e.code === "F11") {
    e.preventDefault();
    e.stopImmediatePropagation();
    void toggleFullscreen();
    return;
  }

  if (e.code === "Escape" && fullscreenActive) {
    e.preventDefault();
    e.stopImmediatePropagation();
    void setAppFullscreen(false);
  }
}

export function initFullscreen() {
  document.addEventListener("fullscreenchange", syncWebFullscreenChrome);
  document.addEventListener("webkitfullscreenchange", syncWebFullscreenChrome as EventListener);
  document.addEventListener("keydown", onFullscreenHotkey, true);

  if (window.tWindow) {
    void window.tWindow.listen("tauri://resize", () => {
      void syncTauriFullscreenChrome();
      if (fullscreenActive) {
        void invokeFullscreen("refit_fullscreen_webview");
      }
    });
    void syncTauriFullscreenChrome();
  }

  window.toggleFullscreen = toggleFullscreen;
}
