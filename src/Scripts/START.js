import { loadScene } from '../Scene/SceneManagement.js';
import { toButton } from '../Graphics/Graphics.Button.js';
import { setExitListener, setOverrideRightKeys } from '../InputSystem/InputSystem.Keyboard.js';
import { playBGM } from '../Audio/Audio.Bgm.js';
import { pushDialogWindow } from './WINDOW/WINDOW.js';
import { initGallery } from './GALLERY.js';
import { loadBackgroundScene } from './BACKGROUND.js';
import { loadGame, applyGameState } from '../Core/GameSave.js';
import { execUntilNextLine } from '../Core/Events.js';

export async function loadStartScene(hasGallery=true) {
    const startScene = await loadScene("UI/START");

    let exitBtn = hasGallery ? startScene.getObjectByName("EXIT2") : startScene.getObjectByName("EXIT1");

    toButton(startScene.getObjectByName("START"), {callback: async () => {
        await loadBackgroundScene();
        await pushDialogWindow();
    }});
    
    toButton(startScene.getObjectByName("LOAD"), {callback: () => {
        console.log('LOAD button clicked');
        const loadWindow = window.open('/save_load.html?mode=load', 'LoadGame', 'width=600,height=600');
        
        // Listen for messages from the save/load window
        const messageHandler = (event) => {
            if (event.data.type === 'load-game') {
                const slotIndex = event.data.slotIndex;
                console.log('Loading game from slot:', slotIndex);
                
                const gameState = loadGame(slotIndex);
                if (gameState) {
                    // Load background scene and dialog window first
                    loadBackgroundScene().then(() => {
                        pushDialogWindow().then(() => {
                            // Apply the loaded state
                            applyGameState(gameState);
                            // Execute to the next line to refresh UI
                            execUntilNextLine();
                        });
                    });
                }
                
                window.removeEventListener('message', messageHandler);
            } else if (event.data.type === 'save-load-cancelled') {
                window.removeEventListener('message', messageHandler);
            }
        };
        
        window.addEventListener('message', messageHandler);
    }});
    
    toButton(startScene.getObjectByName("CONFIG"), {callback: () => {
        console.log('CONFIG button clicked');
    }});
    if (hasGallery) {
        toButton(startScene.getObjectByName("GALLERY"), {callback: () => {
            initGallery();
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

    startScene.onAfterFocusCallbacks.push(() => {
        setExitListener(() => {
            if ($(exitBtn.domElement).is(":focus")) {
                window.exit();
            } else {
                $(exitBtn.domElement).focus();
            }
        });
    });
    
    playBGM("M07");
    setOverrideRightKeys(false);
}

