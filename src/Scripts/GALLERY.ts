import { CharacterNameToVoiceKey } from "../Constants";
import { toButton } from "../Graphics/Button";
import { SceneElement } from "../Graphics/SceneElement";
import { setExitListener } from "../InputSystem/InputSystem.Keyboard";
import { loadScene } from "../Scene/SceneManagement";

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

export async function gotoCharacterGallery(characterName: string) {
    const characterGalleryScene = await loadScene(`UI/CG_${characterName}01`);
    if (!characterGalleryScene) {
        console.error("characterGalleryScene is null");
        return;
    }
    for (let i = 3; i <= 15; i++) {
        toButton(characterGalleryScene.sceneObjects[i] as SceneElement, {
            stateIndexes: [1, 3, 2, 0],
            callback: () => {
                // Show full image or do something
            },
        });
    }
    setExitListener(() => {
        const engine = window.getEngine();
        engine?.popScene();
    });
}

async function initMusicGallery() {
    const musicGalleryScene = await loadScene("UI/MUSIC");
}
