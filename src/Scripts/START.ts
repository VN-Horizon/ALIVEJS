import { getProgress } from "@/Core/Save/Progress";
import { getUnlockedCG } from "@/Core/Save/UnlockedCG";
import $ from "jquery";
import { playBGM } from "../Audio/Bgm";
import { execUntilNextLine, ScreenplayContext } from "../Core/Events";
import { applyGameState, loadGame } from "../Core/Save/GameSave";
import { toButton } from "../Graphics/Button";
import { setExitListener, setOverrideRightKeys } from "../InputSystem/InputSystem.Keyboard";
import { destroySceneByName, loadScene } from "../Scene/SceneManagement";
import { loadBackgroundScene } from "./BACKGROUND";
import { initGallery } from "./GALLERY";
import { pushDialogWindow } from "./WINDOW/WINDOW";

export async function loadStartScene(eventsPromise?: Promise<any>) {
    let sceneName = "UI/START";
    const progress = getProgress();
    if (progress[1] + progress[2] + progress[3] > 0) {
        sceneName = "UI/START01";
    }
    if (progress[1] > 0 && progress[2] > 0 && progress[3] > 0) {
        sceneName = "UI/START02";
    }
    if (progress[4] > 0) {
        sceneName = "UI/START03";
    }
    const startScene = await loadScene(sceneName);
    if (!startScene) {
        console.error("Failed to load START scene");
        return;
    }

    const exit1Orig = startScene.getObjectByName("EXIT1");
    const exit2Orig = startScene.getObjectByName("EXIT2");
    
    exit1Orig?.hide();
    exit2Orig?.hide();

    const hasGallery = getUnlockedCG().length > 0 || sceneName !== "UI/START"

    let exitBtnOrig = hasGallery ? exit2Orig : exit1Orig;

    const startBtn = toButton(startScene.getObjectByName("START"), {
        callback: async () => {
            document.getElementById("menu-save")?.removeAttribute("aria-disabled");
            ScreenplayContext.currentBlockIndex = ScreenplayContext.evIdToBlockIndex[512] || 0;
            ScreenplayContext.currentEvId = 512;
            ScreenplayContext.currentInstructionIndex = 0;
            await loadBackgroundScene();
            await pushDialogWindow({ autoAdvance: true });
            if (progress[4] > 0) {

                document.dispatchEvent(new CustomEvent("ShowCg", { detail: { stringParams: ["S03"] }, bubbles: true, cancelable: true }));
            }
            setTimeout(() => {
                destroySceneByName(sceneName);
            }, 1000);
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
                        await pushDialogWindow({ autoAdvance: false });
                    applyGameState(gameState);
                    execUntilNextLine();
                }
            }
        },
    });

    const configBtn = toButton(startScene.getObjectByName("CONFIG"), {
        callback: async () => {
            await window.openSettings();
        },
    });

    const galleryBtn = toButton(startScene.getObjectByName("GALLERY"), {
        callback: () => {
            initGallery();
        },
    });
    
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
    exitBtn?.show();
    if (hasGallery) {
        galleryBtn?.show();
    }

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
