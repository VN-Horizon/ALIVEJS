import type { FocusableElement } from "@/Graphics/FocusableElement";
import type { SceneElementData } from "@/Scene/SceneData";
import $ from "jquery";
import { AnimatedSceneElement } from "../../Graphics/AnimatedSceneElement";
import { toButton, type Button } from "../../Graphics/Button";
import { SceneElement } from "../../Graphics/SceneElement";
import { TMP_Text } from "../../Graphics/TextMessPoor";
import type { DialogWindowScene } from "./WINDOW";

export function initSelectionsBox(dialogWindow: DialogWindowScene | null) {
    if (!dialogWindow) {
        console.error("Dialog window is null in initSelectionsBox");
        return;
    }
    window.isSelecting = false;
    let animationInProgress = false;
    const selectionButtons: (Button | null)[] = [null, null, null];

    for (let i = 1; i <= 3; i++) {
        const selectionObject = dialogWindow.getObjectByName(`選択肢${["１", "２", "３"][i - 1]}`);
        if (!selectionObject) return;
        selectionButtons[i - 1] = toButton(selectionObject, {
            z: 10,
            stateIndexes: [-1, 0, 1, -1],
            defaultTransform: [64, 238 + (i - 1) * 29, 514, 28],
            callback: () => OnSelectionCallback(i),
        });
        selectionButtons[i - 1]?.hide();
    }
    const selectionsText = dialogWindow.addObject(
        new TMP_Text({
            name: "SelectionsText",
            text: "你说得对，但是原神是一款由米哈游自主研发的开放世界冒险游戏。\n你说得对，但是原神是一款由米哈游自主研发的开放世界冒险游戏。\n你说得对，但是原神是一款由米哈游自主研发的开放世界冒险游戏。",
            fontSize: 16,
            color: "#FFFFFF",
            fontWeight: "medium",
            zIndex: 11,
            transform: { x: 70, y: 238, width: 502, height: 86 },
        }),
    );
    $(selectionsText?.domElement).css({
        "white-space": "pre-line",
        "line-height": "29px",
        "pointer-events": "none",
        "text-shadow": "1px 1px 0px #000000",
    });
    selectionsText?.hide();

    // Load the frame animation data from the scene JSON
    const loadFrameAnimation = async () => {
        const sceneData = await $.getJSON("/assets/scenes/UI/WINDOW/WINDOW.json");
        const frameAnimNode = sceneData.children.find((child: SceneElementData) => child.name === "枠アニメ");

        if (!frameAnimNode) {
            console.error("枠アニメ not found in WINDOW.json");
            return null;
        }

        const frameAnimData = {
            ...frameAnimNode,
            fps: 60,
            loop: false,
            autoPlay: false,
        };

        const frameAnim = dialogWindow.addObject(new AnimatedSceneElement(frameAnimData, null, dialogWindow));

        // Create frame children from the JSON data
        frameAnimNode.children.forEach((childData: SceneElementData, index: number) => {
            const child = new SceneElement(childData, frameAnim, dialogWindow);
            if (index !== 0) {
                child.visible = false;
                child.updateDOMStyle();
            }
        });

        frameAnim?.initializeFrames();
        frameAnim?.hide();

        return frameAnim;
    };

    // Initialize frame animation asynchronously
    loadFrameAnimation().then(frameAnim => {
        dialogWindow._frameAnimation = frameAnim;
    });

    const OnSelectionCallback = (i: number) => {
        document.dispatchEvent(
            new CustomEvent("MakeDecisionInternal", {
                detail: { params: [i - 1] },
            }),
        );
        closeSelectionsBox();
    };

    // Get references to UI elements
    const selectingDialogBox = dialogWindow.getObjectByName("選択中");
    const normalDialogBox = dialogWindow.getObjectByName("通常");
    const sayDialogBox = dialogWindow.getObjectByName("吹き出し");

    const openSelectionsBox = () => {
        if (animationInProgress) return;
        animationInProgress = true;
        window.isSelecting = true;

        const frameAnim = dialogWindow._frameAnimation;
        if (!frameAnim) return;

        // Show animation (forward: frames 0-9)
        selectingDialogBox?.show();
        normalDialogBox?.hide();
        sayDialogBox?.hide();
        dialogWindow.getObjectByName("NextLineButton")?.hide();

        frameAnim.show();
        frameAnim.setFrame(0);
        frameAnim.onComplete = () => {
            animationInProgress = false;
            selectionsText?.show();
            selectionButtons.forEach(btn => btn?.show());
        };
        frameAnim.play();
    };

    const closeSelectionsBox = () => {
        if (animationInProgress) return;
        animationInProgress = true;
        window.isSelecting = false;

        const frameAnim = dialogWindow._frameAnimation;
        if (!frameAnim) return;

        // Hide animation (reverse: frames 9-0)
        frameAnim.setFrame(9);
        frameAnim.fps = -60; // Negative fps for reverse playback
        selectionsText?.hide();
        selectionButtons.forEach(btn => btn?.hide());
        const nextLineBtn = dialogWindow.getObjectByName("NextLineButton");
        if (!nextLineBtn) return;
        frameAnim.onComplete = () => {
            frameAnim.hide();
            frameAnim.fps = 60; // Reset fps
            selectingDialogBox?.hide();
            nextLineBtn.show();
            (nextLineBtn as FocusableElement).setFocus();

            // Restore previous dialog box state
            const nameText = dialogWindow.getObjectByName("NameText");
            if (nameText && nameText instanceof TMP_Text && nameText.text !== "祐二") {
                sayDialogBox?.show();
            } else {
                normalDialogBox?.show();
            }

            animationInProgress = false;
        };
        frameAnim.play();
    };

    document.addEventListener("ShowDecisionInternal", (e: Event) => {
        openSelectionsBox();
        selectionsText?.setText((e as CustomEvent).detail.stringParams.join("\n"));
    });

    // V key listener for toggling
    const vKeyHandler = (e: KeyboardEvent) => {
        if (e.key === "v" || e.key === "V") {
            if (window.isSelecting) {
                closeSelectionsBox();
            } else {
                openSelectionsBox();
            }
        }
    };

    document.addEventListener("keydown", vKeyHandler);

    // Clean up on destroy
    dialogWindow.onDestroyCallbacks.push(() => {
        document.removeEventListener("keydown", vKeyHandler);
    });
}
