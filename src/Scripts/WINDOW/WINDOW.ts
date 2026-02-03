import type { AnimatedSceneElement } from "@/Graphics/AnimatedSceneElement";
import type { IScene } from "@/Scene/Scene";
import $ from "jquery";
import { execUntilNextLine } from "../../Core/Events";
import { Button, toButton } from "../../Graphics/Button";
import { TMP_Text, TMP_TypeWriter } from "../../Graphics/TextMessPoor";
import { setExitListener, setOverrideRightKeys } from "../../InputSystem/InputSystem.Keyboard";
import { loadScene } from "../../Scene/SceneManagement";
import { pushPauseScreen } from "../SYSTEM";
import { _hideDialogWindow } from "./WINDOW.DialogHider";
import { initSelectionsBox } from "./WINDOW.SelectionsBox";

export interface DialogWindowScene extends IScene {
    _frameAnimation: AnimatedSceneElement | null | undefined;
}

export async function pushDialogWindow() {
    const dialogWindow = (await loadScene("UI/WINDOW", {
        exclusionList: ["通常クリック範囲", "メッセージ文字", "選択肢文字", "名前ウィンドウ", "名前文字", "枠アニメ"],
    })) as DialogWindowScene | null;

    initSelectionsBox(dialogWindow);

    const nextLineBtn = dialogWindow?.addObject(
        new Button({
            name: "NextLineButton",
            cursor: "default",
            stateIndexes: [-1, -1, -1, -1],
            transforms: [
                [0, 0, 640, 480],
                [0, 0, 640, 480],
                [0, 0, 640, 480],
                [0, 0, 640, 480],
            ],
            images: ["", "", "", ""],
            zIndex: 10,
            callback: async () => {
                onNextLineRequest();
            },
        }),
    );

    const pauseBtn = dialogWindow?.getObjectByName("システムボタン");
    if (!pauseBtn) {
        console.error("Pause button not found in dialog window");
        return;
    }
    toButton(pauseBtn, {
        stateIndexes: [0, 1, 1, 0],
        z: 10,
        focusable: false,
        callback: async () => {
            $(document).off("contextmenu", _hideDialogWindow);
            await pushPauseScreen();
        },
    });
    const dialogText = dialogWindow?.addObject(
        new TMP_TypeWriter({
            name: "DialogText",
            text: "你说得对，但是原神是一款由米哈游自主研发的开放世界冒险游戏。你说得对，但是原神是一款由米哈游自主研发的开放世界冒险游戏。",
            fontSize: 23,
            color: "#FFFFFF",
            fontWeight: "medium",
            transform: { x: 80, y: 346, width: 480, height: 112 },
        }),
    );
    if (!dialogText) {
        console.error("Dialog text object not found");
        return;
    }
    $(dialogText.domElement).css({
        "white-space": "pre-line",
        "line-height": "29px",
        "pointer-events": "none",
        "text-shadow": "1px 1px 0px #000000",
    });

    const nameText = dialogWindow?.addObject(
        new TMP_Text({
            name: "NameText",
            text: "电棍",
            fontSize: 20,
            color: "#FFFFFF",
            fontWeight: "medium",
            transform: { x: 40, y: 288, width: 146, height: 32 },
        }),
    );
    if (!nameText) {
        console.error("Name text object not found");
        return;
    }
    $(nameText.domElement).css({
        "white-space": "pre-line",
        "pointer-events": "none",
        "text-shadow": "1px 1px 0px #000000",
        "text-align": "center",
    });

    const selectingDialogBox = dialogWindow?.getObjectByName("選択中");
    const normalDialogBox = dialogWindow?.getObjectByName("通常");
    const sayDialogBox = dialogWindow?.getObjectByName("吹き出し");
    const nameWindow = dialogWindow?.getObjectByName("名前枠");
    selectingDialogBox?.hide();
    sayDialogBox?.hide();

    // Hook PlayDialogInternal event to animate next line
    const playDialogHandler = (e: Event) => {
        const { stringParams, params } = (e as CustomEvent).detail;
        const [characterName, dialogContent] = stringParams;
        if (params[0] == "Hidden" || !characterName) {
            if (nameWindow) nameWindow.visible = false;
            nameText.setText("");
        } else if (params[0] == "Special") {
        } else {
            if (nameWindow) nameWindow.visible = true;
            nameText.setText(characterName);
        }

        if (characterName && characterName !== "祐二") {
            sayDialogBox?.show();
            normalDialogBox?.hide();
        } else {
            sayDialogBox?.hide();
            normalDialogBox?.show();
        }
        nameWindow?.syncDom();

        // Animate the dialog text
        dialogText.animateText(dialogContent + " ▾");

        // Auto-advance when skipping
        if (window.skipping) {
            setTimeout(() => {
                if (window.skipping) {
                    onNextLineRequest();
                }
            }, 0);
        }
    };

    document.addEventListener("PlayDialogInternal", playDialogHandler);
    dialogWindow?.onDestroyCallbacks.push(() => {
        document.removeEventListener("PlayDialogInternal", playDialogHandler);
    });

    // Handle skip mode starting
    const skipModeStartHandler = () => {
        if (window.skipping) {
            onNextLineRequest();
        }
    };
    document.addEventListener("SkipModeStarted", skipModeStartHandler);
    dialogWindow?.onDestroyCallbacks.push(() => {
        document.removeEventListener("SkipModeStarted", skipModeStartHandler);
    });

    setExitListener(() => pushPauseScreen());
    dialogWindow?.onAfterFocusCallbacks.push(() => {
        setOverrideRightKeys(true);
        setExitListener(() => pushPauseScreen());
        $(document).on("contextmenu", _hideDialogWindow);
    });
    setOverrideRightKeys(true);
    $(document).on("contextmenu", _hideDialogWindow);
    dialogWindow?.onDestroyCallbacks.push(() => {
        setOverrideRightKeys(false);
        $(document).off("contextmenu", _hideDialogWindow);
    });

    nextLineBtn?.setFocus();
}

export function onNextLineRequest() {
    const dialogWindow = window.getEngine().getSceneByName("UI/WINDOW");
    if (!dialogWindow) return;

    const dialogText = dialogWindow.getObjectByName<TMP_TypeWriter>("DialogText");
    if (!dialogText) return;

    if (dialogText.isAnimating && !window.skipping) {
        dialogText.cancelAnimation();
        return;
    }

    execUntilNextLine();
}
