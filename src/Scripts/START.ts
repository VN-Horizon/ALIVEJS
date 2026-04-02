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

export async function loadStartScene(hasGallery = true, eventsPromise?: Promise<any>) {
    const startScene = await loadScene("UI/START");
    if (!startScene) {
        console.error("Failed to load START scene");
        return;
    }

    const exit1Orig = startScene.getObjectByName("EXIT1");
    const exit2Orig = startScene.getObjectByName("EXIT2");
    
    exit1Orig?.hide();
    exit2Orig?.hide();

    let exitBtnOrig = hasGallery ? exit2Orig : exit1Orig;

    const startBtn = toButton(startScene.getObjectByName("START"), {
        callback: async () => {
            document.getElementById("menu-save")?.removeAttribute("aria-disabled");
            await loadBackgroundScene();
            await pushDialogWindow();
        },
    });

    const loadBtn = toButton(startScene.getObjectByName("LOAD"), {
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

    const configBtn = toButton(startScene.getObjectByName("CONFIG"), {
        callback: () => {
            console.log("CONFIG button clicked");
        },
    });

    let galleryBtn = null;
    if (hasGallery) {
        galleryBtn = toButton(startScene.getObjectByName("GALLERY"), {
            callback: () => {
                initGallery();
            },
        });
    }
    
    const exitBtn = toButton(exitBtnOrig, { callback: window.exit });

    startBtn?.hide();
    loadBtn?.hide();
    configBtn?.hide();
    galleryBtn?.hide();
    exitBtn?.hide();

    $("#black-overlay").fadeOut(600);

    if (eventsPromise) {
        await eventsPromise;
    }

    startBtn?.show();
    loadBtn?.show();
    configBtn?.show();
    galleryBtn?.show();
    exitBtn?.show();

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
