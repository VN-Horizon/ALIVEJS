import $ from "jquery";

import { loadEvents } from "./Core/Events";
import { GameEngine } from "./Core/NotUnityEngine";
import "./InputSystem/InputSystem.Gamepad.ts";
import "./InputSystem/InputSystem.Keyboard.ts";
import { loadStartScene } from "./Scripts/START.js";

import { initBGM } from "./Audio/Bgm.js";
import { initSE } from "./Audio/Se.js";
import "./Audio/Voice.js";
import "./Audio/🔓.js";

// import { initEnginePane } from "./Debug/EnginePane.js";
// import { initSceneGraphPane } from "./Debug/SceneGraphPane.js";

// Define types for existing classes if needed, or use any for now
declare global {
    interface Window {
        getEngine: () => GameEngine;
        exit: () => void;
        skipping: boolean;
        isSelecting: boolean;
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
