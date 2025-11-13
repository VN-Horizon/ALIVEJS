import { AllowedCharacterNames } from '../Constants.js';

let ScreenplayContext = {
    blocks: [],
    textPool: [],
    currentBlockIndex: 0,
    currentInstructionIndex: 0,
    evIdToBlockIndex: {},
};

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

export function extractDialogData(lineText)
{
    // 获取引号所在位置
    if (!lineText) return ['', lineText, 'Hidden'];
    let quoteIndex = lineText.indexOf('「');

    if (quoteIndex <= 0) return ['', lineText, 'Hidden'];

    let candidate = lineText.slice(0, quoteIndex).trim();
    if (candidate.length <= 0 || candidate.length >= 8)
        return ['', lineText, 'Hidden'];

    // 检测角色名称显示模式
    let mode = 'Display';
    let name = candidate;
    let closingQuoteIndex = lineText.lastIndexOf('」');
    let content = closingQuoteIndex > quoteIndex 
        ? lineText.substring(quoteIndex + 1, closingQuoteIndex).trim()
        : lineText.substring(quoteIndex + 1).trim();
    if (candidate.length > 4 && candidate.startsWith("・・") && candidate.endsWith("・・")) {
        mode = 'Special';
        name = candidate.substring(2, candidate.length - 3).trim();
    } else if (candidate.length > 2 && candidate.startsWith("・") && candidate.endsWith("・")) {
        mode = 'Hidden';
        name = candidate.substring(1, candidate.length - 1).trim();
    }

    // 如果提取的名字不在角色列表中，则将整行作为内容并隐藏名字显示
    if (!AllowedCharacterNames.includes(name))
    {
        return ['', lineText, 'Hidden'];
    }

    return [name, content, mode];
}

function updateBlockIndex(eventBlock, returnValueIndex = 0) {
    const currentEvent = getCurrentEvent();

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
            dispatchEvent('ResetLineCounter');
            continue;
        }
        
        const currentEvent = getCurrentEvent();
        const instruction = getCurrentInstruction();
        
        const resolvedInstruction = {
            type: instruction.type,
            params: instruction.params,
            stringParams: resolveStrings(instruction, ScreenplayContext.textPool)
        };
        console.log(`${ScreenplayContext.currentInstructionIndex} / ${currentEvent.instructions.length} /`, resolvedInstruction);
        
        dispatchEvent(instruction.type, resolvedInstruction);
        
        switch (resolvedInstruction.type) {
            case 'PlayDialog':
                updateBlockIndex(currentEvent);
                const lineText = resolvedInstruction.stringParams[0];
                const lineData = extractDialogData(lineText);
                dispatchEvent('PlayDialogInternal', {
                    params: [lineData[2], ScreenplayContext.currentBlockIndex],
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

        console.log('Events loaded successfully!', eventMappings.events[0].instructions);

        // Initialize screenplay context with loaded data
        initScreenplayContext(
            eventMappings.events || [],
            eventMappings.textPool || []
        );

        return eventMappings;
    } catch (error) {
        console.error('Error loading events:', error);
        throw error;
    }
}
