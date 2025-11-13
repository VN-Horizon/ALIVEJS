import { loadScene, destroyScene } from '../Scene/SceneManagement.js';
import { toButton } from '../Graphics/Graphics.Button.js';
import { toBackground } from '../Graphics/Graphics.Background.js';
import { setExitListener, setOverrideRightKeys } from '../InputSystem/InputSystem.Keyboard.js';

export async function pushPauseScreen() {
    const pauseScene = await loadScene("UI/SYSTEM", { singleInstance: true });
    if (!pauseScene) return;
    toButton(pauseScene.getObjectByName("SAVE"));
    toButton(pauseScene.getObjectByName("LOAD"));
    toButton(pauseScene.getObjectByName("CONFIG"));
    toButton(pauseScene.getObjectByName("EXIT"));
    const feather = pauseScene.getObjectByName("羽セット");
    toBackground(feather.findChildByName("光玉(奥)"), { scrollSpeedY: -100 });
    const bg2 = toBackground(feather.findChildByName("光玉(中)"), { scrollSpeedY: -200});
    const bg3 = toBackground(feather.findChildByName("光玉(前)"), { scrollSpeedY: -300});
    bg2.transform.y = 0;
    bg3.transform.y = 0;
    bg2.syncDom();
    bg3.syncDom();
    setExitListener(() => { destroyScene(); });
    setOverrideRightKeys(false);
}
