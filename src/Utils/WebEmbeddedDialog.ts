/** postMessage type: child asks host to remove the embedded dialog shell. */
export const EMBEDDED_WEB_DIALOG_CLOSE = "alive-embedded-dialog-close";

type WebDialogShell = HTMLElement & { __aliveWebDialogCleanup?: () => void };

/** Map pointer clientX/Y to the top-level visual viewport (fixes iframe vs parent mismatch). */
function pointerClientInRootViewport(ev: PointerEvent): { x: number; y: number } {
  let win = ev.view as Window | null;
  if (!win) return { x: ev.clientX, y: ev.clientY };
  let x = ev.clientX;
  let y = ev.clientY;
  while (win.parent !== win) {
    const frame = win.frameElement as HTMLElement | null;
    if (!frame) break;
    const r = frame.getBoundingClientRect();
    x += r.left;
    y += r.top;
    win = win.parent;
  }
  return { x, y };
}

function attachDraggablePanel(
  handle: HTMLElement,
  panel: HTMLElement,
  excludeFromDrag: Element | null,
  options?: {
    dragIframe?: HTMLIFrameElement | null;
  }
) {
  const dragIframe = options?.dragIframe ?? null;

  let dragging = false;
  let activePointerId = -1;
  let startRootX = 0;
  let startRootY = 0;

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    handle.removeEventListener("pointermove", onMove);
    handle.removeEventListener("pointerup", onUp);
    handle.removeEventListener("pointercancel", onUp);
    if (activePointerId !== -1) {
      try { handle.releasePointerCapture(activePointerId); } catch { /* already released */ }
      activePointerId = -1;
    }
    if (dragIframe) dragIframe.style.pointerEvents = "";

    const r = panel.getBoundingClientRect();
    panel.style.left = `${r.left}px`;
    panel.style.top = `${r.top}px`;
    panel.style.transform = "";
    panel.style.willChange = "";
  };

  const onMove = (ev: PointerEvent) => {
    if (!dragging) return;
    const { x, y } = pointerClientInRootViewport(ev);
    const dx = x - startRootX;
    const dy = y - startRootY;
    panel.style.transform = `translate3d(${dx}px,${dy}px,0)`;
  };

  const onUp = () => {
    endDrag();
  };

  handle.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    if (excludeFromDrag?.contains(e.target as Node)) return;
    dragging = true;
    activePointerId = e.pointerId;
    handle.setPointerCapture(e.pointerId);

    const r = panel.getBoundingClientRect();
    panel.style.left = `${r.left}px`;
    panel.style.top = `${r.top}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    panel.style.transform = "translate3d(0,0,0)";
    panel.style.willChange = "transform";

    const p0 = pointerClientInRootViewport(e);
    startRootX = p0.x;
    startRootY = p0.y;

    if (dragIframe) dragIframe.style.pointerEvents = "none";

    handle.addEventListener("pointermove", onMove, { passive: true });
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
    e.preventDefault();
  });
}

export function openWebEmbeddedDialog(id: string, url: string, title: string, width: number, height: number) {
  const prev = document.querySelector(
    `[data-alive-web-dialog="${CSS.escape(id)}"]`
  ) as WebDialogShell | null;
  prev?.__aliveWebDialogCleanup?.();

  const shell = document.createElement("div") as WebDialogShell;
  shell.dataset.aliveWebDialog = id;
  const DIALOG_VIEWPORT_MARGIN = 12;
  const applyViewportBoundedSize = () => {
    const vv = window.visualViewport;
    const viewportWidth = vv?.width ?? window.innerWidth;
    const viewportHeight = vv?.height ?? window.innerHeight;
    const boundedWidth = Math.max(
      240,
      Math.min(width, Math.floor(Math.max(0, viewportWidth - DIALOG_VIEWPORT_MARGIN * 2)))
    );
    const boundedHeight = Math.max(
      180,
      Math.min(height, Math.floor(Math.max(0, viewportHeight - DIALOG_VIEWPORT_MARGIN * 2)))
    );
    shell.style.width = `${boundedWidth}px`;
    shell.style.height = `${boundedHeight}px`;
    shell.style.maxWidth = `calc(100vw - ${DIALOG_VIEWPORT_MARGIN * 2}px)`;
    shell.style.maxHeight = `calc(100dvh - ${DIALOG_VIEWPORT_MARGIN * 2}px)`;
  };
  shell.style.cssText = [
    "position:fixed",
    "z-index:2147483646",
    `width:${width}px`,
    `height:${height}px`,
    "left:50%",
    "top:50%",
    "transform:translate(-50%,-50%)",
    "display:flex",
    "flex-direction:column",
    "background:#c0c0c0",
    "border:1px solid",
    "border-color:#dfdfdf #404040 #404040 #dfdfdf",
    "box-shadow:4px 4px 12px rgba(0,0,0,0.4)",
    "overflow:hidden",
  ].join(";");

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "flex:1;border:none;width:100%;min-height:0;background:#c0c0c0;";
  iframe.src = url;
  iframe.setAttribute("title", title);

  shell.append(iframe);

  const teardown = () => {
    window.removeEventListener("message", onHostMessage);
    window.removeEventListener("resize", applyViewportBoundedSize);
    window.visualViewport?.removeEventListener("resize", applyViewportBoundedSize);
    if (shell.isConnected) shell.remove();
  };
  shell.__aliveWebDialogCleanup = teardown;

  const onHostMessage = (ev: MessageEvent) => {
    if (ev.data?.type === EMBEDDED_WEB_DIALOG_CLOSE && ev.data?.id === id) {
      teardown();
    }
  };
  window.addEventListener("message", onHostMessage);

  iframe.addEventListener("load", () => {
    const cw = iframe.contentWindow;
    if (!cw) return;
    (cw as Window & { __ALIVE_EMBEDDED_DIALOG__?: boolean }).__ALIVE_EMBEDDED_DIALOG__ = true;
    (cw as Window & { __ALIVE_EMBEDDED_DIALOG_ID__?: string }).__ALIVE_EMBEDDED_DIALOG_ID__ = id;
    try {
      const doc = cw.document;
      doc.documentElement.style.height = "100%";
      doc.documentElement.style.overflow = "auto";
      doc.body.style.height = "100%";
      doc.body.style.minHeight = "0";
      doc.body.style.overflow = "auto";
      doc.querySelectorAll(".window").forEach((el) => {
        (el as HTMLElement).style.flex = "1";
        (el as HTMLElement).style.minHeight = "0";
        (el as HTMLElement).style.height = "100%";
      });
      doc.querySelectorAll(".window-body").forEach((el) => {
        (el as HTMLElement).style.flex = "1";
        (el as HTMLElement).style.minHeight = "0";
        (el as HTMLElement).style.overflow = "auto";
      });
      doc.querySelectorAll(".tab-content").forEach((el) => {
        (el as HTMLElement).style.minHeight = "0";
        (el as HTMLElement).style.overflow = "auto";
      });
      doc.querySelectorAll(".sunken-panel, textarea").forEach((el) => {
        (el as HTMLElement).style.minHeight = "0";
        (el as HTMLElement).style.overflow = "auto";
      });
      const innerTitleBar = doc.querySelector(".title-bar") as HTMLElement | null;
      if (innerTitleBar) {
        const controls = doc.querySelector(".title-bar-controls");
        attachDraggablePanel(innerTitleBar, shell, controls, { dragIframe: iframe });
      }
    } catch {
      /* cross-origin */
    }
  });

  applyViewportBoundedSize();
  window.addEventListener("resize", applyViewportBoundedSize, { passive: true });
  window.visualViewport?.addEventListener("resize", applyViewportBoundedSize, { passive: true });

  document.body.appendChild(shell);
  iframe.focus({ preventScroll: true });
}

/** True when the current page is hosted inside an embedded iframe dialog. */
export function isEmbeddedDialog(): boolean {
  return !!(window as Window & { __ALIVE_EMBEDDED_DIALOG__?: boolean }).__ALIVE_EMBEDDED_DIALOG__;
}

/** Target for postMessage when a dialog runs in web mode (popup opener or embedded iframe host). */
export function getWebDialogPostMessageTarget(): Window | null {
  if (window.opener) return window.opener;
  if (isEmbeddedDialog() && window.parent !== window) return window.parent;
  return null;
}
