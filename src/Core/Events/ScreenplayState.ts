import { clearAutoContinueTimer } from "@/Core/AutoContinueTimer";
import { type EventInstruction, type EventMapping, type ScreenplayContextState } from "@/types/events";

export const ScreenplayContext: ScreenplayContextState = {
    blocks: [],
    textPool: [],
    currentBlockIndex: 0,
    currentInstructionIndex: 0,
    evIdToBlockIndex: {},
    passedEvIds: new Set(),
};

export let lastInstruction: EventInstruction | null = null;

export function setLastInstruction(instruction: EventInstruction | null) {
    lastInstruction = instruction;
}

export function initScreenplayContext(blocks: EventMapping[], textPool: string[]): void {
    clearAutoContinueTimer();
    const evIdToBlockIndex: Record<number, number> = {};

    blocks.forEach((block, i) => {
        const evId = block.evId;
        evIdToBlockIndex[evId] = i;
    });

    ScreenplayContext.blocks = blocks || [];
    ScreenplayContext.textPool = textPool || [];
    ScreenplayContext.currentBlockIndex = 0;
    ScreenplayContext.currentInstructionIndex = 0;
    ScreenplayContext.evIdToBlockIndex = evIdToBlockIndex;
    ScreenplayContext.passedEvIds = new Set<number>();

    // Expose ScreenplayContext globally for GameSave
    window.ScreenplayContext = ScreenplayContext;
}

export function getCurrentBlockIndex(): number {
    return ScreenplayContext.currentBlockIndex;
}

export function getCurrentEvent(): EventMapping {
    return ScreenplayContext.blocks[ScreenplayContext.currentBlockIndex];
}

export function getCurrentInstruction(): EventInstruction {
    const currentEvent = getCurrentEvent();
    return currentEvent.instructions[ScreenplayContext.currentInstructionIndex];
}
