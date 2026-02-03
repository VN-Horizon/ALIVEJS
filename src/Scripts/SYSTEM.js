import { execUntilNextLine } from "../Core/Events";
import { applyGameState, loadGame, saveGame } from "../Core/GameSave";
import { toBackground } from "../Graphics/Background.js";
import { toButton } from "../Graphics/Button.js";
import { setExitListener, setOverrideRightKeys } from "../InputSystem/InputSystem.Keyboard.ts";
import { destroyScene, loadScene } from "../Scene/SceneManagement.js";

export async function pushPauseScreen() {
    const pauseScene = await loadScene("UI/SYSTEM", { singleInstance: true });
    if (!pauseScene) return;

    toButton(pauseScene.getObjectByName("SAVE"), {
        callback: () => {
            console.log("SAVE button clicked");
            const saveWindow = window.open("/save_load.html?mode=save", "SaveGame", "width=600,height=600");

            // Listen for messages from the save/load window
            const messageHandler = event => {
                if (event.data.type === "save-game") {
                    const slotIndex = event.data.slotIndex;
                    console.log("Saving game to slot:", slotIndex);
                    saveGame(slotIndex);
                    window.removeEventListener("message", messageHandler);
                } else if (event.data.type === "save-load-cancelled") {
                    window.removeEventListener("message", messageHandler);
                }
            };

            window.addEventListener("message", messageHandler);
        },
    });

    toButton(pauseScene.getObjectByName("LOAD"), {
        callback: () => {
            console.log("LOAD button clicked");
            const loadWindow = window.open("/save_load.html?mode=load", "LoadGame", "width=600,height=600");

            // Listen for messages from the save/load window
            const messageHandler = event => {
                if (event.data.type === "load-game") {
                    const slotIndex = event.data.slotIndex;
                    console.log("Loading game from slot:", slotIndex);

                    const gameState = loadGame(slotIndex);
                    if (gameState) {
                        // Apply the loaded state
                        applyGameState(gameState);
                        // Close the pause menu
                        destroyScene();
                        // Execute to the next line to refresh UI
                        execUntilNextLine();
                    }

                    window.removeEventListener("message", messageHandler);
                } else if (event.data.type === "save-load-cancelled") {
                    window.removeEventListener("message", messageHandler);
                }
            };

            window.addEventListener("message", messageHandler);
        },
    });

    toButton(pauseScene.getObjectByName("CONFIG"));
    toButton(pauseScene.getObjectByName("EXIT"), {
        callback: () => {
            window.exit();
        },
    });
    const feather = pauseScene.getObjectByName("羽セット");
    toBackground(feather.findChildByName("光玉(奥)"), { scrollSpeedY: -100 });
    const bg2 = toBackground(feather.findChildByName("光玉(中)"), { scrollSpeedY: -200 });
    const bg3 = toBackground(feather.findChildByName("光玉(前)"), { scrollSpeedY: -300 });
    bg2.transform.y = 0;
    bg3.transform.y = 0;
    bg2.syncDom();
    bg3.syncDom();
    setExitListener(() => {
        destroyScene();
    });
    setOverrideRightKeys(false);
}
