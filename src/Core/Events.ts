import $ from "jquery";
import protobuf from "protobufjs";
import { extractDialogData } from "../Utils/DialogHelper";

// -- Interfaces --

export interface Instruction {
    type: string;
    params: number[];
    stringParams: string[];
}

export interface EventBlock {
    evId: number;
    instructions: Instruction[];
    returnValues: number[];
}

export interface ScreenplayContextState {
    blocks: EventBlock[];
    textPool: string[];
    currentBlockIndex: number;
    currentInstructionIndex: number;
    evIdToBlockIndex: Record<number, number>;
}

export interface ResolvedInstruction extends Instruction {}

// Global declaration for window
declare global {
    interface Window {
        ScreenplayContext: ScreenplayContextState;
    }
}

// -- State --

let ScreenplayContext: ScreenplayContextState = {
    blocks: [],
    textPool: [],
    currentBlockIndex: 0,
    currentInstructionIndex: 0,
    evIdToBlockIndex: {},
};

let lastInstruction: Instruction | null = null;

// -- Functions --

export function initScreenplayContext(blocks: EventBlock[], textPool: string[]): void {
    const evIdToBlockIndex: Record<number, number> = {};

    blocks.forEach((block, i) => {
        const evId = block.evId;
        evIdToBlockIndex[evId] = i;
    });

    ScreenplayContext = {
        blocks: blocks || [],
        textPool: textPool || [],
        currentBlockIndex: 0,
        currentInstructionIndex: 0,
        evIdToBlockIndex,
    };

    // Expose ScreenplayContext globally for GameSave
    window.ScreenplayContext = ScreenplayContext;
}

export function getCurrentBlockIndex(): number {
    return ScreenplayContext.currentBlockIndex;
}

export function getCurrentEvent(): EventBlock {
    return ScreenplayContext.blocks[ScreenplayContext.currentBlockIndex];
}

export function getCurrentInstruction(): Instruction {
    const currentEvent = getCurrentEvent();
    return currentEvent.instructions[ScreenplayContext.currentInstructionIndex];
}

export function resolveStrings(instruction: Instruction | null, textPool: string[]): string[] {
    const result: string[] = [];
    if (!instruction?.stringParams) return result;

    for (const token of instruction.stringParams) {
        if (token.length > 1 && token[0] === "$") {
            const inner = token.slice(1);
            const idx = parseInt(inner);
            if (!isNaN(idx) && idx >= 0 && idx < textPool.length) {
                result.push(textPool[idx]);
                continue;
            }
        }
        result.push(token);
    }
    return result;
}

function updateBlockIndex(eventBlock: EventBlock, returnValueIndex: number = 0): void {
    const currentEvent = getCurrentEvent();
    lastInstruction = getCurrentInstruction();

    if (ScreenplayContext.currentInstructionIndex === currentEvent.instructions.length - 1) {
        console.log("Moving to next event block:", eventBlock);
        const nextEvId = eventBlock.returnValues[returnValueIndex];
        ScreenplayContext.currentBlockIndex = ScreenplayContext.evIdToBlockIndex[nextEvId];
        ScreenplayContext.currentInstructionIndex = 0;
        return;
    }

    ScreenplayContext.currentInstructionIndex++;
}

function dispatchEvent(type: string, detail: any = {}): void {
    document.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, cancelable: true }));
}

export function execUntilNextLine(decisionIndex: number = -1): string[] | undefined {
    while (true) {
        if (decisionIndex !== -1) {
            updateBlockIndex(getCurrentEvent(), decisionIndex);
            decisionIndex = -1;
            continue;
        }

        const currentEvent = getCurrentEvent();
        const instruction = getCurrentInstruction();

        const resolvedInstruction = resolveCurrentInstruction();
        console.log(
            `${ScreenplayContext.currentInstructionIndex} / ${currentEvent.instructions.length} /`,
            resolvedInstruction,
        );

        if (!resolvedInstruction) break;

        dispatchEvent(instruction.type, resolvedInstruction);

        switch (resolvedInstruction.type) {
            case "PlayDialog":
                updateBlockIndex(currentEvent);
                const lineText = resolvedInstruction.stringParams[0];
                const lineData = extractDialogData(lineText);
                dispatchEvent("PlayDialogInternal", {
                    params: [lineData[2], ScreenplayContext.currentBlockIndex, resolvedInstruction.params[1]],
                    stringParams: [lineData[0], lineData[1]],
                });
                return [lineData[0]]; // Returning dialog text essentially

            case "ShowDecision":
                const stringParams = resolvedInstruction.stringParams.filter(s => s && s.length > 0);
                dispatchEvent("ShowDecisionInternal", {
                    params: [],
                    stringParams,
                });
                return stringParams;
        }

        updateBlockIndex(currentEvent);
    }
    return undefined;
}

export function resolveLastInstruction(): ResolvedInstruction | null {
    const instruction = lastInstruction;
    if (!instruction) return null;
    return {
        type: instruction.type,
        params: instruction.params,
        stringParams: resolveStrings(instruction, ScreenplayContext.textPool),
    };
}

export function resolveCurrentInstruction(): ResolvedInstruction | null {
    const instruction = getCurrentInstruction();
    if (!instruction) return null;
    return {
        type: instruction.type,
        params: instruction.params,
        stringParams: resolveStrings(instruction, ScreenplayContext.textPool),
    };
}

// @ts-expect-error - CustomEvent type
document.addEventListener("MakeDecisionInternal", (e: CustomEvent) => {
    const decisionIndex = e.detail.params[0];
    execUntilNextLine(decisionIndex);
});

export async function loadEvents(): Promise<any> {
    try {
        const root = await protobuf.load("/assets/events/events.proto");
        const EventMappings = root.lookupType("events.EventMappings");
        const response = await fetch("/assets/events/events.pb");
        const arrayBuffer = await response.arrayBuffer();
        const decodedEvents = EventMappings.decode(new Uint8Array(arrayBuffer));
        const eventMappings = EventMappings.toObject(decodedEvents, {
            enums: String, // enums as string names
            defaults: true, // includes default values
        }) as { events: EventBlock[]; textPool: string[] };

        console.log("Events loaded successfully!", eventMappings.events);
        if (eventMappings.events && eventMappings.events.length > 0) {
            console.log("Events loaded successfully!", eventMappings.events[0].instructions);
        }

        // Initialize screenplay context with loaded data
        initScreenplayContext(eventMappings.events || [], eventMappings.textPool || []);

        $(document).on("RestoreSave", (e: any) => {
            const { currentBg, currentBgm, currentPortrait, currentBlockIndex, currentInstructionIndex } = e.detail;
            window.ScreenplayContext.currentBlockIndex = currentBlockIndex || 0;
            window.ScreenplayContext.currentInstructionIndex = currentInstructionIndex || 0;
            document.dispatchEvent(
                new CustomEvent("RestoreGraphics", {
                    detail: { bg: currentBg, character: currentPortrait },
                }),
            );
            document.dispatchEvent(
                new CustomEvent("PlayBgm", {
                    detail: { stringParams: [currentBgm] },
                }),
            );
        });

        document.dispatchEvent(new CustomEvent("EventsLoaded", { bubbles: true, cancelable: true }));

        return eventMappings;
    } catch (error) {
        console.error("Error loading events:", error);
        throw error;
    }
}
