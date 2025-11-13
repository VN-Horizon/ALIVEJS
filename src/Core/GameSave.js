import { getCurrentEvent } from './Events.js';
import { CharacterLineCounts } from '../Audio/Audio.Voice.js';

const SAVE_KEY_PREFIX = 'alive_save_';
const MAX_SAVE_SLOTS = 20;

export function getCurrentGameState() {
    const engine = window.getEngine();
    const backgroundScene = engine?.getSceneByName("BACKGROUND");
    
    let currentBg = null;
    let currentPortrait = null;
    
    if (backgroundScene) {
        const bgElement = backgroundScene.getObjectByName("BackgroundCG");
        const portraitElement = backgroundScene.getObjectByName("PortraitCG");
        
        if (bgElement && bgElement.backgroundImage) {
            currentBg = bgElement.backgroundImage;
        }
        if (portraitElement && portraitElement.backgroundImage) {
            currentPortrait = portraitElement.backgroundImage;
        }
    }
    
    // Get screenplay context from Events.js
    const currentEvent = getCurrentEvent();
    
    return {
        currentBlockIndex: window.ScreenplayContext?.currentBlockIndex || 0,
        currentInstructionIndex: window.ScreenplayContext?.currentInstructionIndex || 0,
        currentBg: currentBg,
        currentPortrait: currentPortrait,
        characterLineCounts: { ...CharacterLineCounts },
        timestamp: new Date().toISOString(),
        eventName: currentEvent?.evId || 'Unknown'
    };
}

export function saveGame(slotIndex) {
    if (slotIndex < 0 || slotIndex >= MAX_SAVE_SLOTS) {
        throw new Error(`Invalid slot index: ${slotIndex}`);
    }
    
    const gameState = getCurrentGameState();
    const saveKey = SAVE_KEY_PREFIX + slotIndex;
    
    try {
        localStorage.setItem(saveKey, JSON.stringify(gameState));
        console.log(`Game saved to slot ${slotIndex}`, gameState);
        return true;
    } catch (error) {
        console.error('Failed to save game:', error);
        return false;
    }
}

export function loadGame(slotIndex) {
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
        console.error('Failed to load game:', error);
        return null;
    }
}

export function getAllSaves() {
    const saves = [];
    
    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
        const saveKey = SAVE_KEY_PREFIX + i;
        const saveData = localStorage.getItem(saveKey);
        
        if (saveData) {
            try {
                const gameState = JSON.parse(saveData);
                saves.push({
                    slotIndex: i,
                    ...gameState
                });
            } catch (error) {
                console.error(`Failed to parse save in slot ${i}:`, error);
            }
        }
    }
    
    return saves;
}

export function deleteSave(slotIndex) {
    if (slotIndex < 0 || slotIndex >= MAX_SAVE_SLOTS) {
        throw new Error(`Invalid slot index: ${slotIndex}`);
    }
    
    const saveKey = SAVE_KEY_PREFIX + slotIndex;
    localStorage.removeItem(saveKey);
    console.log(`Save deleted from slot ${slotIndex}`);
}

export function applyGameState(gameState) {
    if (!gameState) {
        console.error('No game state to apply');
        return false;
    }
    
    // Update screenplay context
    if (window.ScreenplayContext) {
        window.ScreenplayContext.currentBlockIndex = gameState.currentBlockIndex || 0;
        window.ScreenplayContext.currentInstructionIndex = gameState.currentInstructionIndex || 0;
    }
    
    // Restore character line counts
    if (gameState.characterLineCounts) {
        for (const key in CharacterLineCounts) {
            delete CharacterLineCounts[key];
        }
        for (const key in gameState.characterLineCounts) {
            CharacterLineCounts[key] = gameState.characterLineCounts[key];
        }
    }
    
    // Dispatch events to update background and portrait
    if (gameState.currentBg) {
        document.dispatchEvent(new CustomEvent('RestoreBgImg', { 
            detail: { backgroundImage: gameState.currentBg } 
        }));
    }
    
    if (gameState.currentPortrait) {
        document.dispatchEvent(new CustomEvent('RestoreCharaImg', { 
            detail: { backgroundImage: gameState.currentPortrait } 
        }));
    }
    
    console.log('Game state applied:', gameState);
    return true;
}
