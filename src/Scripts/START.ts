import $ from "jquery";
import { playBGM } from "../Audio/Bgm";
import { execUntilNextLine } from "../Core/Events";
import { applyGameState, loadGame } from "../Core/GameSave";
import { toButton } from "../Graphics/Button";
import { setExitListener, setOverrideRightKeys } from "../InputSystem/InputSystem.Keyboard";
import { loadScene } from "../Scene/SceneManagement";
import { loadBackgroundScene } from "./BACKGROUND";
import { initGallery } from "./GALLERY";
import { pushDialogWindow } from "./WINDOW/WINDOW";

export async function loadStartScene(hasGallery = true) {
    const startScene = await loadScene("UI/START");
    if (!startScene) {
        console.error("Failed to load START scene");
        return;
    }

    let exitBtn = hasGallery ? startScene.getObjectByName("EXIT2") : startScene.getObjectByName("EXIT1");

    toButton(startScene.getObjectByName("START"), {
        callback: async () => {
            document.getElementById("menu-save")?.removeAttribute("aria-disabled");
            await loadBackgroundScene();
            await pushDialogWindow();
        },
    });

    toButton(startScene.getObjectByName("LOAD"), {
        callback: async () => {
            console.log("LOAD button clicked");
            const slotIndex = await window.openSaveLoadDialog("load");
            if (slotIndex !== null) {
                console.log("Loading game from slot:", slotIndex);
                const gameState = loadGame(slotIndex);
                if (gameState) {
                    document.getElementById("menu-save")?.removeAttribute("aria-disabled");
                    await loadBackgroundScene();
                    await pushDialogWindow();
                    applyGameState(gameState);
                    execUntilNextLine();
                }
            }
        },
    });

    toButton(startScene.getObjectByName("CONFIG"), {
        callback: () => {
            console.log("CONFIG button clicked");
        },
    });
    if (hasGallery) {
        toButton(startScene.getObjectByName("GALLERY"), {
            callback: () => {
                initGallery();
            },
        });
    }
    exitBtn = toButton(exitBtn, { callback: window.exit });

    setExitListener(() => {
        if ($(exitBtn?.domElement).is(":focus")) {
            window.exit();
        } else {
            $(exitBtn?.domElement).focus();
        }
    });

    startScene.onAfterFocusCallbacks.push(() => {
        setExitListener(() => {
            if ($(exitBtn?.domElement).is(":focus")) {
                window.exit();
            } else {
                $(exitBtn?.domElement).focus();
            }
        });
    });

    playBGM("M07");
    setOverrideRightKeys(false);
}
