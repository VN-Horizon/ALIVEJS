import { execUntilNextLine } from "../Core/Events";
import { applyGameState, loadGame, saveGame } from "../Core/GameSave";
import { toBackground } from "../Graphics/Background";
import { toButton } from "../Graphics/Button";
import { setExitListener, setOverrideRightKeys } from "../InputSystem/InputSystem.Keyboard";
import { destroyScene, loadScene } from "../Scene/SceneManagement";

export async function pushPauseScreen() {
    const pauseScene = await loadScene("UI/SYSTEM", { singleInstance: true });
    if (!pauseScene) return;

    toButton(pauseScene.getObjectByName("SAVE"), {
        callback: async () => {
            console.log("SAVE button clicked");
            window.openSaveLoadDialog("save").then((slotIndex) => {
                if (slotIndex !== null) {
                    console.log("Saving game to slot:", slotIndex);
                    saveGame(slotIndex);
                }
            });
        },
    });

    toButton(pauseScene.getObjectByName("LOAD"), {
        callback: async () => {
            console.log("LOAD button clicked");
            window.openSaveLoadDialog("load").then((slotIndex) => {
                if (slotIndex !== null) {
                    console.log("Loading game from slot:", slotIndex);
                    const gameState = loadGame(slotIndex);
                    if (gameState) {
                        applyGameState(gameState);
                        destroyScene();
                        execUntilNextLine();
                    }
                }
            });
        },
    });

    toButton(pauseScene.getObjectByName("CONFIG"));
    toButton(pauseScene.getObjectByName("EXIT"), {
        callback: () => {
            window.exit();
        },
    });
    const feather = pauseScene.getObjectByName("羽セット");
    if (!feather) {
        console.error("Feather object not found in SYSTEM scene");
        return;
    }
    toBackground(feather.findChildByName("光玉(奥)"), { scrollSpeedY: -100 });
    const bg2 = toBackground(feather.findChildByName("光玉(中)"), { scrollSpeedY: -200 });
    const bg3 = toBackground(feather.findChildByName("光玉(前)"), { scrollSpeedY: -300 });
    if (bg2) bg2.transform.y = 0;
    if (bg3) bg3.transform.y = 0;
    if (bg2) bg2.syncDom();
    if (bg3) bg3.syncDom();
    setExitListener(() => {
        destroyScene();
    });
    setOverrideRightKeys(false);
}
