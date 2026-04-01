import $ from "jquery";

import { loadEvents, type ScreenplayContextState } from "./Core/Events";
import { GameEngine } from "./Core/NotUnityEngine";
import "./InputSystem/InputSystem.Gamepad.ts";
import "./InputSystem/InputSystem.Keyboard.ts";

import "98.css";
import { initTranslation } from "@/Utils/Translator";
import type { Window as TWindow } from "@tauri-apps/api/window";
import { initBGM } from "./Audio/Bgm";
import { initSE } from "./Audio/Se";
import "./Audio/Voice";
import "./Audio/🔓";
import { initEventGraphOverlay } from "./Debug/Graph/EventGraphEditor";
import { loadStartScene } from "./Scripts/START";
import { initMenuBar } from "./Utils/MenuBar";
import { initWindowManager } from "./Utils/WindowManager";
import "./styles/NotUnityPlayer.css";

declare global {
  interface Window {
    openVersionInfo: () => void;
    openCodecVersionInfo: () => void;
    getEngine: () => GameEngine;
    exit: () => void;
    minimize: () => void;
    toggleMaximize: () => void;
    isSelecting: boolean;
    translationPlainMap?: Record<string, string>;
    isBacklogOpen: boolean;
    skipping: boolean;
    ScreenplayContext: ScreenplayContextState;
    tWindow: TWindow|undefined;
  }
}

async function init() {
  try {
    await initWindowManager();
    
    let notUnityEngine = new GameEngine();
    notUnityEngine.start();
    window.getEngine = () => notUnityEngine;

    $("body").css("opacity", "1");
    console.log("Initializing application...");
    await loadEvents();
    initEventGraphOverlay();
    initBGM();
    initSE();
    await loadStartScene();
    await initTranslation();
    $("#black-overlay").fadeOut(600);
  } catch (error: any) {
    console.error(error);
  }
}

initMenuBar();
init().then(() => console.log("Init Finished."));
