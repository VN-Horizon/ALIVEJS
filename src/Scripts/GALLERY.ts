import { playBGM, getCurrentBGM } from "@/Audio/Bgm";
import { toButton } from "@/Components/Button";
import { SceneElement } from "@/Components/SceneElement";
import { toToggle, type Toggle } from "@/Components/Toggle";
import { CharacterNameToVoiceKey } from "@/Constants";
import { getUnlockedCG } from "@/Core/Save/UnlockedCG";
import { getScreenEffectsTransitionDurationMs } from "@/Core/Settings";
import {
    setExitListener
} from "@/InputSystem/InputSystem.Keyboard";
import { loadScene } from "@/Scene/SceneManagement";
import $ from "jquery";
import { pushCgPlayerScene } from "./GALLERY/GALLERY.CgPlayer";

export async function initGallery() {
  // Load gallery data from JSON
  const galleryScene = await loadScene("UI/GALLERY");
  if (!galleryScene) {
    console.error("Failed to load GALLERY scene");
    return;
  }

  toButton(galleryScene.getObjectByName("MUSIC"), {
    callback: () => {
      initMusicGallery();
    },
  });
  toButton(galleryScene.getObjectByName("CG"), {
    callback: () => {
      initCGGallery();
    },
  });

  setExitListener(() => {
    const engine = window.getEngine();
    engine?.popScene();
  });
}

async function initCGGallery() {
  const cgGalleryScene = await loadScene("UI/CG");
  if (!cgGalleryScene) {
    console.error("Failed to load CG gallery scene");
    return;
  }
  ["柚木", "祐里子", "久遠", "春菜", "その他"].forEach((characterName, i) => {
    toButton(cgGalleryScene.getObjectByName(characterName), {
      stateIndexes: [-1, 0, 1, -1],
      defaultTransform: [69 + 75 * i, 179, 53, 280],
      callback: async () => {
        await gotoCharacterGallery(
          (CharacterNameToVoiceKey as Record<string, string>)[characterName] || "ETC"
        );
      },
    });
  });
}

export async function gotoCharacterGallery(
  characterName: string,
  page: number = 1,
  replaceSceneName?: string
) {
  const characterGalleryScene = await loadScene(`UI/CG_${characterName}0${page}`, {
    skipEntranceFade: Boolean(replaceSceneName),
  });
  if (!characterGalleryScene) {
    console.error("characterGalleryScene is null");
    return;
  }
  const baseSceneObjects = [...characterGalleryScene.sceneObjects] as SceneElement[];
  const startIndex = page === 1 ? 3 : 0;
  const endIndex = Math.min(15, baseSceneObjects.length - 1);
  const available = getUnlockedCG();

  for (let i = startIndex; i <= endIndex; i++) {
    const cgItem = baseSceneObjects[i] as SceneElement;
    if (!cgItem) continue;
    if (!Array.isArray(cgItem.children) || cgItem.children.length === 0) continue;
    const cgNames = cgItem.sceneData.name?.split(",") || [];
    if (cgNames.length === 0) continue;
    if (!cgItem || !/^[A-Z]\d{2}$/.test(cgNames[0] || "")) continue;
    const unlocked = cgNames.every((part) => available.includes(part.trim()));
    toButton(cgItem, {
      flags: ["keep-base-while-hover"],
      disabled: !unlocked,
      stateIndexes: [1, 2, 3, 0],
      callback: () => {
        pushCgPlayerScene(cgNames);
      },
    });
  }
  toButton(characterGalleryScene.getObjectByName("BACK"), {
    stateIndexes: [0, 1, 1, 0],
    callback: () => {
      const engine = window.getEngine();
      engine?.popScene();
    },
  });
  if (page === 1) {
    toButton(characterGalleryScene.getObjectByName("PAGE1/2"), {
      stateIndexes: [0, 1, 2, 0],
      flags: ["always-keep-base"],
      callback: async () => {
        await gotoCharacterGallery(characterName, 2, characterGalleryScene.name);
      },
    });
  } else if (page === 2) {
    toButton(characterGalleryScene.getObjectByName("PAGE2/2"), {
      stateIndexes: [0, 1, 2, 0],
      flags: ["always-keep-base"],
      callback: async () => {
        await gotoCharacterGallery(characterName, 1, characterGalleryScene.name);
      },
    });
  }
  setExitListener(() => {
    const engine = window.getEngine();
    engine?.popScene();
  });

  if (replaceSceneName && replaceSceneName !== characterGalleryScene.name) {
    window.getEngine()?.removeSceneByName(replaceSceneName, { instant: true });
  }
}

function fadeElementOpacity(element: SceneElement | null, opacity: number, ms: number) {
  if (!element?.domElement) return Promise.resolve();
  element.show();
  if (ms <= 0) {
    element.opacity = opacity;
    element.updateDOMStyle();
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    $(element.domElement).stop(true).fadeTo(ms, opacity, () => {
      element.opacity = opacity;
      resolve();
    });
  });
}

async function initMusicGallery() {
  const musicGalleryScene = await loadScene("UI/MUSIC");
  if (!musicGalleryScene) {
    console.error("Failed to load MUSIC gallery scene");
    return;
  }

  const score1 = musicGalleryScene.getObjectByName("SCORE1");
  const score2 = musicGalleryScene.getObjectByName("SCORE2");
  if (score2) {
    score2.opacity = 0;
    score2.updateDOMStyle();
  }
  for (let i = 16; i <= 30; i++) {
    musicGalleryScene.getObjectByName(i.toString().padStart(2, "0"))?.hide();
  }

  const trackButtons: Array<Toggle | null> = [];
  const currentBgm = getCurrentBGM();
  let currentPage = 1;
  let pageTransitioning = false;

  const setPlayingTrack = (trackIndex: number) => {
    playBGM(`M${trackIndex.toString().padStart(2, "0")}`);
    trackButtons.forEach((button, i) => {
      button?.setOn(i + 1 === trackIndex, false);
    });
  };

  for (let i = 1; i <= 30; i++) {
    const item = musicGalleryScene.getObjectByName(i.toString().padStart(2, "0"));
    const hoverLayer = item?.children?.[0];
    trackButtons.push(
      toToggle(item, {
        stateIndexes: [-1, 2, 0, 2, 1],
        defaultTransform: [
          hoverLayer?.x ?? null,
          hoverLayer?.y ?? null,
          hoverLayer?.width ?? null,
          hoverLayer?.height ?? null,
        ],
        visible: i <= 15,
        initialOn: currentBgm === `M${i.toString().padStart(2, "0")}`,
        callback: () => {
          setPlayingTrack(i);
        },
      })
    );
  }

  const applyTrackPage = (page: number) => {
    trackButtons.forEach((button, i) => {
      const onThisPage = page === 1 ? i < 15 : i >= 15;
      if (onThisPage) button?.show();
      else button?.hide();
      button?.setOn(false, false);
    });
  };

  const gotoPage = async (page: number) => {
    if (page === currentPage || pageTransitioning) return;
    pageTransitioning = true;
    const ms = getScreenEffectsTransitionDurationMs();
    applyTrackPage(page);
    await Promise.all([
      fadeElementOpacity(page === 1 ? score1 : score2, 1, ms),
      fadeElementOpacity(page === 1 ? score2 : score1, 0, ms),
    ]);
    currentPage = page;
    pageTransitioning = false;
  };

  toButton(musicGalleryScene.getObjectByName("タブ１"), {
    stateIndexes: [-1, -1, -1, -1],
    defaultTransform: [294, 56, 36, 136],
    z: 10,
    callback: () => {
      void gotoPage(1);
    },
  });
  toButton(musicGalleryScene.getObjectByName("タブ２"), {
    stateIndexes: [-1, -1, -1, -1],
    defaultTransform: [294, 196, 36, 100],
    z: 10,
    callback: () => {
      void gotoPage(2);
    },
  });

  setExitListener(() => {
    window.getEngine()?.popScene();
  });
}
