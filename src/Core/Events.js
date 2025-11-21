import { extractDialogData } from "../Utils/DialogHelper.js";

let ScreenplayContext = {
    blocks: [],
    textPool: [],
    currentBlockIndex: 0,
    currentInstructionIndex: 0,
    evIdToBlockIndex: {},
};

let lastInstruction = null;

export function initScreenplayContext(blocks, textPool) {
    ScreenplayContext = {
        blocks: blocks || [],
        textPool: textPool || [],
        currentBlockIndex: 0,
        currentInstructionIndex: 0,
        evIdToBlockIndex: {},
    };
    
    blocks.forEach((block, i) => {
        const evId = block.evId;
        ScreenplayContext.evIdToBlockIndex[evId] = i;
    });
    
    // Expose ScreenplayContext globally for GameSave.js
    window.ScreenplayContext = ScreenplayContext;
}

export function getCurrentBlockIndex() {
    return ScreenplayContext.currentBlockIndex;
}

export function getCurrentEvent() {
    return ScreenplayContext.blocks[ScreenplayContext.currentBlockIndex];
}

export function getCurrentInstruction() {
    const currentEvent = getCurrentEvent();
    return currentEvent.instructions[ScreenplayContext.currentInstructionIndex];
}

export function resolveStrings(instruction, textPool) {
    const result = [];
    if (!instruction?.stringParams) return result;

    for (const token of instruction.stringParams) {
        if (token.length > 1 && token[0] === '$') {
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

function updateBlockIndex(eventBlock, returnValueIndex = 0) {
    const currentEvent = getCurrentEvent();
    lastInstruction = getCurrentInstruction();

    if (ScreenplayContext.currentInstructionIndex === currentEvent.instructions.length - 1) {
        console.log('Moving to next event block:', eventBlock);
        const nextEvId = eventBlock.returnValues[returnValueIndex];
        ScreenplayContext.currentBlockIndex = ScreenplayContext.evIdToBlockIndex[nextEvId];
        ScreenplayContext.currentInstructionIndex = 0;
        return;
    }
    
    ScreenplayContext.currentInstructionIndex++;
}

function dispatchEvent(type, detail = {}) {
    document.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, cancelable: true }));
}

export function execUntilNextLine(decisionIndex = -1) {
    while (true) {
        if (decisionIndex !== -1) {
            updateBlockIndex(getCurrentEvent(), decisionIndex);
            decisionIndex = -1;
            continue;
        }
        
        const currentEvent = getCurrentEvent();
        const instruction = getCurrentInstruction();
        
        const resolvedInstruction = resolveCurrentInstruction();
        console.log(`${ScreenplayContext.currentInstructionIndex} / ${currentEvent.instructions.length} /`, resolvedInstruction);
        
        dispatchEvent(instruction.type, resolvedInstruction);
        
        switch (resolvedInstruction.type) {
            case 'PlayDialog':
                updateBlockIndex(currentEvent);
                const lineText = resolvedInstruction.stringParams[0];
                const lineData = extractDialogData(lineText);
                dispatchEvent('PlayDialogInternal', {
                    params: [lineData[2], ScreenplayContext.currentBlockIndex, resolvedInstruction.params[1]],
                    stringParams: [lineData[0], lineData[1]]
                });
                return [lineData[0]];

            case 'ShowDecision':
                const stringParams = resolvedInstruction.stringParams.filter(s => s && s.length > 0);
                dispatchEvent('ShowDecisionInternal', {
                    params: [],
                    stringParams
                });
                return stringParams;
        }
        
        updateBlockIndex(currentEvent);
    }
}

export function resolveLastInstruction() {
    const instruction = lastInstruction;
    if (!instruction) return null;
    return {
        type: instruction.type,
        params: instruction.params,
        stringParams: resolveStrings(instruction, ScreenplayContext.textPool)
    };
}
export function resolveCurrentInstruction() {
    const instruction = getCurrentInstruction();
    if (!instruction) return null;
    return {
        type: instruction.type,
        params: instruction.params,
        stringParams: resolveStrings(instruction, ScreenplayContext.textPool)
    };
}

document.addEventListener('MakeDecisionInternal', (e) => {
    const decisionIndex = e.detail.params[0];
    execUntilNextLine(decisionIndex);
});

export async function loadEvents() {
    try {
        const EventMappings = (await protobuf.load('/assets/events/events.proto'))
                                    .lookupType('events.EventMappings');
        const response = await fetch('/assets/events/events.pb');
        const arrayBuffer = await response.arrayBuffer();
        const decodedEvents = EventMappings.decode(new Uint8Array(arrayBuffer));
        const eventMappings = EventMappings.toObject(decodedEvents, {
            enums: String,  // enums as string names
            defaults: true, // includes default values
        });

        console.log('Events loaded successfully!', eventMappings.events);
        console.log('Events loaded successfully!', eventMappings.events[0].instructions);

        // Initialize screenplay context with loaded data
        initScreenplayContext(
            eventMappings.events || [],
            eventMappings.textPool || []
        );

        $(document).on('RestoreSave', (e) => {
            const { currentBg, currentBgm, currentPortrait, currentBlockIndex, currentInstructionIndex } = e.detail;
            window.ScreenplayContext.currentBlockIndex = currentBlockIndex || 0;
            window.ScreenplayContext.currentInstructionIndex = currentInstructionIndex || 0;
            document.dispatchEvent(new CustomEvent('RestoreGraphics', { 
                detail: { bg: currentBg, character: currentPortrait } 
            }));
            document.dispatchEvent(new CustomEvent('PlayBgm', { 
                detail: { stringParams: [currentBgm] } 
            }));
        });

        document.dispatchEvent(new CustomEvent('EventsLoaded', { bubbles: true, cancelable: true }));

        return eventMappings;
    } catch (error) {
        console.error('Error loading events:', error);
        throw error;
    }
}
