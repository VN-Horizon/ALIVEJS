import $ from "jquery";
import { setExitListener } from "../../InputSystem/InputSystem.Keyboard.ts";
import { pushPauseScreen } from "../SYSTEM.js";

export function hideDialogWindow() {
    const dialogWindow = window.getEngine().getSceneByName("UI/WINDOW");
    console.log("Hiding dialog window", dialogWindow);
    dialogWindow?.hide();
    setExitListener(() => showDialogWindow());
}

export function showDialogWindow() {
    const dialogWindow = window.getEngine().getSceneByName("UI/WINDOW");
    console.log("Showing dialog window", dialogWindow);
    dialogWindow?.show();
    setExitListener(() => pushPauseScreen());
}

export function _hideDialogWindow(e) {
    hideDialogWindow();
    $(document).off("contextmenu", _hideDialogWindow);
    $(document).on("contextmenu", _showDialogWindow);
    $(document).on("click", _showDialogWindow);
    e.preventDefault();
}
export function _showDialogWindow(e) {
    showDialogWindow();
    $(document).off("contextmenu", _showDialogWindow);
    $(document).on("contextmenu", _hideDialogWindow);
    $(document).off("click", _showDialogWindow);
    e.preventDefault();
}
