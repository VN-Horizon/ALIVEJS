import { getCurrentBGM } from "@/Audio/Bgm";
import { Background } from "@/Graphics/Background";
import { getCurrentEvent } from "../Events";

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
    comment?: string;
}

export function getCurrentGameState(): GameState {
    const engine = window.getEngine();
    const backgroundScene = engine?.getSceneByName("BACKGROUND");

    let currentBg = null;
    let currentPortrait = null;

    if (backgroundScene) {
        const bgObject = backgroundScene.getObjectByName("BackgroundCG");
        const portraitObject = backgroundScene.getObjectByName("PortraitCG");

        if (bgObject && bgObject instanceof Background) {
            currentBg = bgObject.backgroundImageUrl;
        }
        if (portraitObject && portraitObject instanceof Background) {
            currentPortrait = portraitObject.backgroundImageUrl;
        }
    }

    // Get screenplay context from Events
    const currentEvent = getCurrentEvent();
    
    // Check for comment from save dialog
    let comment = localStorage.getItem("_temp_save_comment") || "";
    localStorage.removeItem("_temp_save_comment"); // clear it immediately

    return {
        currentBlockIndex: window.ScreenplayContext?.currentBlockIndex || 0,
        currentInstructionIndex: window.ScreenplayContext?.currentInstructionIndex - 1 || 0,
        currentBg: currentBg,
        currentBgm: getCurrentBGM(),
        currentPortrait: currentPortrait,
        timestamp: new Date().toISOString(),
        eventName: currentEvent?.evId || "Unknown",
        comment: comment,
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
