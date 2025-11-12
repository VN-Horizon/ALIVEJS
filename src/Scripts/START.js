import { loadScene } from '../Scene/SceneManagement.js';
import { toButton } from '../Graphics/Graphics.Button.js';
import { setExitListener, setOverrideRightKeys } from '../InputSystem/InputSystem.Keyboard.js';
import { playBGM } from '../Audio/Audio.Bgm.js';
import { pushDialogWindow } from './WINDOW/WINDOW.js';

export async function loadStartScene(hasGallery=false) {
    const startScene = await loadScene("UI/START");

    let exitBtn = hasGallery ? startScene.getObjectByName("EXIT2") : startScene.getObjectByName("EXIT1");

    toButton(startScene.getObjectByName("START"), {callback: async () => {
        await pushDialogWindow();
    }});
    toButton(startScene.getObjectByName("LOAD"), {callback: () => {
        console.log('LOAD button clicked');
    }});
    toButton(startScene.getObjectByName("CONFIG"), {callback: () => {
        console.log('CONFIG button clicked');
    }});
    if (hasGallery) {
        toButton(startScene.getObjectByName("GALLERY"), {callback: () => {
            console.log('GALLERY button clicked');
        }});
    }
    exitBtn = toButton(exitBtn, {callback: window.exit});

    setExitListener(() => {
        if ($(exitBtn.domElement).is(":focus")) {
            window.exit();
        } else {
            $(exitBtn.domElement).focus();
        }
    });
    
    playBGM("M07");
    setOverrideRightKeys(false);
}

