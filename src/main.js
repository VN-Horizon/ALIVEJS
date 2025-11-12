import { GameEngine } from './Core/NotUnityEngine.js';
import { loadEvents } from './Core/Events.js';
import { initBGM } from './Audio/Audio.Bgm.js';
import { loadStartScene } from './Scripts/START.js';
import './InputSystem/InputSystem.Keyboard.js';
import './InputSystem/InputSystem.Gamepad.js';

import './Audio/Audio.🔓.js';

let notUnityEngine = new GameEngine('gameContainer');
notUnityEngine.start();

window.getEngine = () => notUnityEngine;

async function main() {
    try {
        console.log('Initializing application...');
        const events = await loadEvents();
        initBGM();
        await loadStartScene();
        $('#black-overlay').fadeOut(600);
    } catch (error) {
        alert(`Failed to initialize:\n${error.message}`);
        console.error(error);
    }
}

window.exit = () => {
    $('#black-overlay').fadeIn(600, () => {
        window.close();
        $(gameContainer).remove();
    });
};

main();
