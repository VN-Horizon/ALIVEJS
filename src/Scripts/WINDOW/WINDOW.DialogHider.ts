import { setExitListener } from "@/InputSystem/InputSystem.Keyboard";
import $ from "jquery";
import { pushPauseScreen } from "../SYSTEM";

let deferredClickShowListenerHandle: number | null = null;

function cancelDeferredClickShowListener() {
  if (deferredClickShowListenerHandle !== null) {
    window.clearTimeout(deferredClickShowListenerHandle);
    deferredClickShowListenerHandle = null;
  }
}

export function hideDialogWindow() {
  const dialogWindow = window.getEngine().getSceneByName("UI/WINDOW");
  console.log("Hiding dialog window");
  dialogWindow?.hide();
  setExitListener(() => showDialogWindow());
}

export function showDialogWindow() {
  const dialogWindow = window.getEngine().getSceneByName("UI/WINDOW");
  console.log("Showing dialog window");
  dialogWindow?.show();
  setExitListener(() => pushPauseScreen());
}

function applyDialogHiddenDocumentListeners() {
  $(document).off("contextmenu", _hideDialogWindow);
  $(document).on("contextmenu", _showDialogWindow);
  $(document).off("click", _showDialogWindow);
  cancelDeferredClickShowListener();
  deferredClickShowListenerHandle = window.setTimeout(() => {
    deferredClickShowListenerHandle = null;
    $(document).on("click", _showDialogWindow);
  }, 0);
}

function applyDialogVisibleDocumentListeners() {
  cancelDeferredClickShowListener();
  $(document).off("contextmenu", _showDialogWindow);
  $(document).off("click", _showDialogWindow);
  $(document).on("contextmenu", _hideDialogWindow);
}

export function _hideDialogWindow(e: any) {
  hideDialogWindow();
  applyDialogHiddenDocumentListeners();
  e.preventDefault();
}

export function _showDialogWindow(e: any) {
  showDialogWindow();
  applyDialogVisibleDocumentListeners();
  e.preventDefault();
}

export function toggleDialogWindowVisibility() {
  const engine = window.getEngine?.();
  if (!engine) return;
  const dialogWindow = engine.getSceneByName("UI/WINDOW");
  if (!dialogWindow) return;

  const hidden = dialogWindow.rootElement.style.display === "none";
  if (hidden) {
    showDialogWindow();
    applyDialogVisibleDocumentListeners();
  } else {
    hideDialogWindow();
    applyDialogHiddenDocumentListeners();
  }
}
