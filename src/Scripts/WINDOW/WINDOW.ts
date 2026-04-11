import { execUntilNextLine, skipAutoContinueWait } from "@/Core/Events";
import { loadSettings } from "@/Core/Settings";
import type { AnimatedSceneElement } from "@/Graphics/AnimatedSceneElement";
import { Button, toButton } from "@/Graphics/Button";
import { TMP_Text, TMP_TypeWriter } from "@/Graphics/TextMessPoor";
import { toToggle } from "@/Graphics/Toggle";
import { setExitListener, setOverrideRightKeys } from "@/InputSystem/InputSystem.Keyboard";
import type { IScene } from "@/Scene/Scene";
import { loadScene } from "@/Scene/SceneManagement";
import { isAutoContinuePaused, setAutoContinuePauseHandler } from "@/Utils/AutoContinueTimer";
import { $translate } from "@/Utils/Translator";
import $ from "jquery";
import { pushPauseScreen } from "../SYSTEM";
import { initBacklog } from "./WINDOW.Backlog";
import { initCutscenePlayer } from "./WINDOW.CutscenePlayer";
import { _hideDialogWindow } from "./WINDOW.DialogHider";
import { initSelectionsBox } from "./WINDOW.SelectionsBox";

export interface DialogWindowScene extends IScene {
  _frameAnimation: AnimatedSceneElement | null | undefined;
}

export interface PushDialogWindowOptions {
  autoAdvance?: boolean;
}

export const DIALOG_WINDOW_PATH = "UI/WINDOW";

export const DIALOG_WINDOW_EXCLUSION_LIST = [
  "通常クリック範囲",
  "メッセージ文字",
  "選択肢文字",
  "名前ウィンドウ",
  "名前文字",
  "枠アニメ",
] as const;

/** Load WINDOW assets and mount the scene hidden. Does not register input/dialog listeners. */
export async function preloadDialogWindowScene(): Promise<void> {
  const engine = window.getEngine?.();
  if (!engine || engine.isMountedScene(DIALOG_WINDOW_PATH)) return;
  const scene = await loadScene(DIALOG_WINDOW_PATH, {
    exclusionList: [...DIALOG_WINDOW_EXCLUSION_LIST],
  });
  scene?.hide();
}

export async function pushDialogWindow(options: PushDialogWindowOptions = {}) {
  const { autoAdvance = true } = options;
  const engine = window.getEngine();
  if (!engine) {
    console.error("Game engine not available");
    return;
  }

  let dialogWindow = engine.getSceneByName(DIALOG_WINDOW_PATH) as DialogWindowScene | null;
  if (!dialogWindow) {
    dialogWindow = (await loadScene(DIALOG_WINDOW_PATH, {
      exclusionList: [...DIALOG_WINDOW_EXCLUSION_LIST],
    })) as DialogWindowScene | null;
  }
  if (!dialogWindow) {
    console.error("Failed to load dialog window");
    return;
  }

  engine.bringSceneLayerToFront(dialogWindow);
  dialogWindow.show();

  const alreadyWired = dialogWindow.getObjectByName("DialogText") != null;
  if (alreadyWired) {
    setExitListener(() => pushPauseScreen());
    setOverrideRightKeys(true);
    dialogWindow.getObjectByName<Button>("NextLineButton")?.setFocus();
    if (autoAdvance) {
      onNextLineRequest();
    }
    return;
  }

  await initSelectionsBox(dialogWindow);
  initBacklog(dialogWindow);
  initCutscenePlayer(dialogWindow);

  const nextLineBtn = dialogWindow?.addObject(
    new Button({
      name: "NextLineButton",
      cursor: "default",
      stateIndexes: [-1, -1, -1, -1],
      transforms: [
        [0, 0, 640, 480],
        [0, 0, 640, 480],
        [0, 0, 640, 480],
        [0, 0, 640, 480],
      ],
      images: ["", "", "", ""],
      zIndex: 10,
      disabled: false,
      callback: async () => {
        onNextLineRequest();
      },
    })
  );

  const pauseBtn = dialogWindow?.getObjectByName("システムボタン");
  if (!pauseBtn) {
    console.error("Pause button not found in dialog window");
    return;
  }
  toButton(pauseBtn, {
    stateIndexes: [0, 1, 1, 0],
    z: 10,
    focusable: false,
    callback: async () => {
      $(document).off("contextmenu", _hideDialogWindow);
      await pushPauseScreen();
    },
  });

  const settings = loadSettings();

  const dialogText = dialogWindow?.addObject(
    new TMP_TypeWriter({
      name: "DialogText",
      text: "",
      fontSize: 23,
      color: "#FFFFFF",
      fontWeight: "medium",
      transform: { x: 80, y: 346, width: 480, height: 112 },
    })
  );
  if (!dialogText) {
    console.error("Dialog text object not found");
    return;
  }
  $(dialogText.domElement).css({
    "font-family": settings.fontFamily,
    "white-space": "pre-line",
    "line-height": "29px",
    "pointer-events": "none",
    "text-shadow": settings.dropShadow ? "1px 1px 0px #000000" : "none",
  });

  const nameText = dialogWindow?.addObject(
    new TMP_Text({
      name: "NameText",
      text: "",
      fontSize: 20,
      color: "#FFFFFF",
      fontWeight: "medium",
      transform: { x: 40, y: 291, width: 146, height: 32 },
    })
  );
  if (!nameText) {
    console.error("Name text object not found");
    return;
  }
  $(nameText.domElement).css({
    "font-family": settings.fontFamily,
    "white-space": "pre-line",
    "pointer-events": "none",
    "text-shadow": settings.dropShadow ? "1px 1px 0px #000000" : "none",
    "text-align": "center",
  });

  const selectingDialogBox = dialogWindow?.getObjectByName("選択中");
  const normalDialogBox = dialogWindow?.getObjectByName("通常");
  const sayDialogBox = dialogWindow?.getObjectByName("吹き出し");
  const nameWindow = dialogWindow?.getObjectByName("名前枠");
  normalDialogBox?.hide();
  selectingDialogBox?.hide();
  sayDialogBox?.hide();

  // Hook PlayDialogInternal event to animate next line
  const playDialogHandler = (e: Event) => {
    const { stringParams, params } = (e as CustomEvent).detail;
    const [characterName, dialogContent] = stringParams;
    if (params[0] == "Hidden" || !characterName) {
      if (nameWindow) nameWindow.visible = false;
      nameText.setText("");
    } else if (params[0] == "Special") {
    } else {
      if (nameWindow) nameWindow.visible = true;
      nameText.setText($translate(characterName));
    }

    if (characterName && characterName !== "祐二") {
      sayDialogBox?.show();
      normalDialogBox?.hide();
    } else {
      sayDialogBox?.hide();
      normalDialogBox?.show();
    }
    nameWindow?.syncDom();

    // Animate the dialog text
    dialogText.animateText(dialogContent + " ▾");

    // Auto-advance when skipping
    if (window.skipping) {
      setTimeout(() => {
        if (window.skipping) {
          onNextLineRequest();
        }
      }, 0);
    }
  };

  document.addEventListener("PlayDialogInternal", playDialogHandler);
  dialogWindow?.onDestroyCallbacks.push(() => {
    document.removeEventListener("PlayDialogInternal", playDialogHandler);
  });


  const skipToggle = toToggle(dialogWindow?.getObjectByName("早送りボタン"), {
    stateIndexes: [0, 1, 3, 2],
    z: 10,
    focusable: false,
    initialOn: window.skipping,
    onToggleChange: (on: boolean) => {
      console.log("onToggleChange", on);
      window.skipping = on;
      if (on) {
        onNextLineRequest();
      }
    },
  });

  // Handle skip mode starting
  const skipModeHandler = () => {
    if (window.skipping) {
      onNextLineRequest();
    }
    skipToggle?.setOn(window.skipping, false);
  };
  $(document).on("SkipModeStarted", skipModeHandler);
  $(document).on("SkipModeEnded", skipModeHandler);
  dialogWindow?.onDestroyCallbacks.push(() => {
    $(document).off("SkipModeStarted", skipModeHandler);
    $(document).off("SkipModeEnded", skipModeHandler);
  });

  let hiddenByAutoContinue = false;
  setAutoContinuePauseHandler((paused) => {
    if (!dialogWindow) return;
    if (paused) {
      if (hiddenByAutoContinue) return;
      hiddenByAutoContinue = true;
      dialogWindow.hide();
      return;
    }

    if (!hiddenByAutoContinue) return;
    hiddenByAutoContinue = false;
    dialogWindow.show();
  });
  if (isAutoContinuePaused() && dialogWindow) {
    hiddenByAutoContinue = true;
    dialogWindow.hide();
  }
  dialogWindow?.onDestroyCallbacks.push(() => {
    setAutoContinuePauseHandler(null);
  });

  setExitListener(() => pushPauseScreen());
  dialogWindow?.onAfterFocusCallbacks.push(() => {
    setOverrideRightKeys(true);
    setExitListener(() => pushPauseScreen());
    $(document).on("contextmenu", _hideDialogWindow);
  });
  setOverrideRightKeys(true);
  $(document).on("contextmenu", _hideDialogWindow);
  dialogWindow?.onDestroyCallbacks.push(() => {
    setOverrideRightKeys(false);
    $(document).off("contextmenu", _hideDialogWindow);
  });

  nextLineBtn?.setFocus();
  if (autoAdvance) {
    onNextLineRequest();
  }
}

export function onNextLineRequest() {
  if (skipAutoContinueWait()) return;

  const dialogWindow = window.getEngine().getSceneByName(DIALOG_WINDOW_PATH);
  if (!dialogWindow) return;

  const dialogText = dialogWindow.getObjectByName<TMP_TypeWriter>("DialogText");
  if (!dialogText) return;

  if (dialogText.isAnimating && !window.skipping) {
    dialogText.cancelAnimation();
    return;
  }

  execUntilNextLine();
}
