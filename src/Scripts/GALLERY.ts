import { CharacterNameToVoiceKey } from "@/Constants";
import { getUnlockedCG } from "@/Core/Save/UnlockedCG";
import { toButton } from "@/Graphics/Button";
import { SceneElement } from "@/Graphics/SceneElement";
import { setExitListener } from "@/InputSystem/InputSystem.Keyboard";
import { loadScene } from "@/Scene/SceneManagement";

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
                await gotoCharacterGallery((CharacterNameToVoiceKey as Record<string, string>)[characterName] || "ETC");
            },
        });
    });
}

export async function gotoCharacterGallery(characterName: string, page: number = 1, replaceSceneName?: string) {
    const characterGalleryScene = await loadScene(`UI/CG_${characterName}0${page}`);
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
        const unlocked = cgNames.every(part => available.includes(part.trim()));
        console.log(`toButton`, cgItem);
        toButton(cgItem, {
            flags: ["keep-base-while-hover"],
            disabled: !unlocked,
            stateIndexes: [1, 2, 3, 0],
            callback: () => {
                // Show full image or do something
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
            }
        });
    } else if (page === 2) {
        toButton(characterGalleryScene.getObjectByName("PAGE2/2"), {
            stateIndexes: [0, 1, 2, 0],
            flags: ["always-keep-base"],
            callback: async () => {
                await gotoCharacterGallery(characterName, 1, characterGalleryScene.name);
            }
        });
    }
    setExitListener(() => {
        const engine = window.getEngine();
        engine?.popScene();
    });

    if (replaceSceneName && replaceSceneName !== characterGalleryScene.name) {
        window.getEngine()?.removeSceneByName(replaceSceneName);
    }
}

async function initMusicGallery() {
    const musicGalleryScene = await loadScene("UI/MUSIC");
}
