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

let notUnityEngine = new GameEngine();
initEventGraphOverlay();
notUnityEngine.start();

window.getEngine = () => notUnityEngine;

async function main() {
  try {
    console.log("Initializing application...");
    await loadEvents();
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

main().then(() => console.log("Init Finished."));
