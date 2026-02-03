import { getCurrentBGM } from "../Audio/Audio.Bgm.js";
import { getCurrentEvent } from "./Events";

const SAVE_KEY_PREFIX = "alive_save_";
const MAX_SAVE_SLOTS = 20;

export interface GameState {
    currentBlockIndex: number;
    currentInstructionIndex: number;
    currentBg: any;
    currentBgm: any;
    currentPortrait: any;
    timestamp: string;
    eventName: string | number;
}

export function getCurrentGameState(): GameState {
    const engine = window.getEngine();
    const backgroundScene = engine?.getSceneByName("BACKGROUND");

    let currentBg = null;
    let currentPortrait = null;

    if (backgroundScene) {
        const bgObject = backgroundScene.getObjectByName("BackgroundCG");
        const portraitObject = backgroundScene.getObjectByName("PortraitCG");

        if (bgObject && bgObject.backgroundImageUrl) {
            currentBg = bgObject.backgroundImageUrl;
        }
        if (portraitObject && portraitObject.backgroundImageUrl) {
            currentPortrait = portraitObject.backgroundImageUrl;
        }
    }

    // Get screenplay context from Events
    const currentEvent = getCurrentEvent();

    return {
        currentBlockIndex: window.ScreenplayContext?.currentBlockIndex || 0,
        currentInstructionIndex: window.ScreenplayContext?.currentInstructionIndex - 1 || 0,
        currentBg: currentBg,
        currentBgm: getCurrentBGM(),
        currentPortrait: currentPortrait,
        timestamp: new Date().toISOString(),
        eventName: currentEvent?.evId || "Unknown",
    };
}

export function saveGame(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= MAX_SAVE_SLOTS) {
        throw new Error(`Invalid slot index: ${slotIndex}`);
    }

    const gameState: GameState = getCurrentGameState();
    const saveKey = SAVE_KEY_PREFIX + slotIndex;

    try {
        localStorage.setItem(saveKey, JSON.stringify(gameState));
        console.log(`Game saved to slot ${slotIndex}`, gameState);
        return true;
    } catch (error) {
        console.error("Failed to save game:", error);
        return false;
    }
}

export function loadGame(slotIndex: number) {
    if (slotIndex < 0 || slotIndex >= MAX_SAVE_SLOTS) {
        throw new Error(`Invalid slot index: ${slotIndex}`);
    }

    const saveKey = SAVE_KEY_PREFIX + slotIndex;
    const saveData = localStorage.getItem(saveKey);

    if (!saveData) {
        return null;
    }

    try {
        const gameState = JSON.parse(saveData);
        console.log(`Game loaded from slot ${slotIndex}`, gameState);
        return gameState;
    } catch (error) {
        console.error("Failed to load game:", error);
        return null;
    }
}

export function getAllSaves(): GameState[] {
    const saves = [];

    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
        const saveKey = SAVE_KEY_PREFIX + i;
        const saveData = localStorage.getItem(saveKey);

        if (saveData) {
            try {
                const gameState = JSON.parse(saveData);
                saves.push({
                    slotIndex: i,
                    ...gameState,
                });
            } catch (error) {
                console.error(`Failed to parse save in slot ${i}:`, error);
            }
        }
    }

    return saves;
}

export function deleteSave(slotIndex: number) {
    if (slotIndex < 0 || slotIndex >= MAX_SAVE_SLOTS) {
        throw new Error(`Invalid slot index: ${slotIndex}`);
    }

    const saveKey = SAVE_KEY_PREFIX + slotIndex;
    localStorage.removeItem(saveKey);
    console.log(`Save deleted from slot ${slotIndex}`);
}

export function applyGameState(gameState: GameState): boolean {
    if (!gameState) {
        console.error("No game state to apply");
        return false;
    }

    document.dispatchEvent(
        new CustomEvent("RestoreSave", {
            detail: gameState,
        }),
    );

    console.log("Game state applied:", gameState);
    return true;
}
