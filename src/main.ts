import $ from "jquery";

import { loadEvents } from "./Core/Events";
import { GameEngine } from "./Core/NotUnityEngine";
import "./InputSystem/InputSystem.Gamepad.ts";
import "./InputSystem/InputSystem.Keyboard.ts";
import { loadStartScene } from "./Scripts/START";

import { initTranslation } from "@/Utils/Translator";
import { initBGM } from "./Audio/Bgm";
import { initSE } from "./Audio/Se";
import "./Audio/Voice";
import "./Audio/🔓";
import { initEventGraphOverlay } from "./Debug/Graph/EventGraphEditor";
import "./styles/NotUnityPlayer.css";

declare global {
  interface Window {
    getEngine: () => GameEngine;
    exit: () => void;
    isSelecting: boolean;
    translationPlainMap?: Record<string, string>;
    isBacklogOpen: boolean;
    skipping: boolean;
  }
}

async function init() {
  try {
    let notUnityEngine = new GameEngine();
    notUnityEngine.start();
    window.getEngine = () => notUnityEngine;
    console.log("Initializing application...");
    await loadEvents();
    initEventGraphOverlay();
    initBGM();
    initSE();
    await loadStartScene();
    await initTranslation();
    $("#black-overlay").fadeOut(600);
  } catch (error: any) {
    alert(`Failed to initialize:\n${error.message}`);
    console.error(error);
  }
}

window.exit = () => {
  $("#black-overlay").fadeIn(600, async () => {
    try {
      if ('__TAURI_INTERNALS__' in window) {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        getCurrentWindow().close();
      } else {
        window.close();
      }
    } catch (e) {
      window.close();
    }
    $("#gameContainer").remove();
  });
};

init().then(() => console.log("Init Finished."));
