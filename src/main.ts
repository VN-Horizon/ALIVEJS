import $ from "jquery";

import { loadEvents } from "./Core/Events";
import { GameEngine } from "./Core/NotUnityEngine";
import "./InputSystem/InputSystem.Gamepad.ts";
import "./InputSystem/InputSystem.Keyboard.ts";
import { loadStartScene } from "./Scripts/START";

import { initBGM } from "./Audio/Bgm";
import { initSE } from "./Audio/Se";
import "./Audio/Voice";
import "./Audio/🔓";

// import { initEnginePane } from "./Debug/EnginePane";
// import { initSceneGraphPane } from "./Debug/SceneGraphPane";

declare global {
    interface Window {
        getEngine: () => GameEngine;
        exit: () => void;
    }
}

let notUnityEngine = new GameEngine();
// initEnginePane(notUnityEngine);
// initSceneGraphPane();
notUnityEngine.start();

window.getEngine = () => notUnityEngine;

async function main() {
    try {
        console.log("Initializing application...");
        const events = await loadEvents();
        initBGM();
        initSE();
        await loadStartScene();
        $("#black-overlay").fadeOut(600);
    } catch (error: any) {
        alert(`Failed to initialize:\n${error.message}`);
        console.error(error);
    }
}

window.exit = () => {
    $("#black-overlay").fadeIn(600, () => {
        window.close();
        $("#gameContainer").remove();
    });
};

main();
