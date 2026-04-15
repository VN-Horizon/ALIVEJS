import $ from "jquery";

import { loadEvents } from "./Core/Events";
import { GameEngine } from "./Core/NotUnityEngine";
import "./InputSystem/InputSystem.Gamepad";
import "./InputSystem/InputSystem.Keyboard";

import "98.css";
import { initTranslation } from "@/Utils/Translator";
import { initBGM } from "./Audio/Bgm";
import { initSE } from "./Audio/Se";
import "./Audio/Voice";
import "./Audio/🔓";
import { loadSettings } from "./Core/Settings";
import { initSceneGraphPane } from "./Debug/SceneGraphPane";
import { loadStartScene } from "./Scripts/START";
import { preloadDialogWindowScene } from "./Scripts/WINDOW/WINDOW";
import { initMenuBar } from "./Utils/MenuBar";
import { initWindowManager } from "./Utils/WindowManager";
import "./styles/NotUnityPlayer.css";


async function init() {
  try {
    await initWindowManager();

    const initialSettings = loadSettings();
    if (initialSettings.dropShadow) {
      document.body.style.setProperty("--index-global-textshadow", "1px 1px 0px #000000");
    } else {
      document.body.style.setProperty("--index-global-textshadow", "none");
    }

    // Listen for settings change
    window.addEventListener("storage", (e) => {
      if (e.key === "alive_settings_updated") {
        window.location.reload();
      }
    });

    let notUnityEngine = new GameEngine();
    notUnityEngine.start();
    window.getEngine = () => notUnityEngine;

    $("body").css("opacity", "1");
    console.log("Initializing application...");
    const eventsPromise = loadEvents();
    const dialogWindowPreload = preloadDialogWindowScene();
    // initTranslation().then();
    setTimeout(() => {
      initBGM();
      initSE();
    }, 0);
    await dialogWindowPreload;
    loadStartScene(eventsPromise).then();
    eventsPromise.then(() => {
      initTranslation();
      initSceneGraphPane();
    });
  } catch (error: any) {
    console.error(error);
  }
}

initMenuBar();
init().then(() => console.log("Init Finished."));
