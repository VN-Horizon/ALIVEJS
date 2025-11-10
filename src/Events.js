window.screenplayContext = {
    blocks: [],
    textPool: [],
    currentBlockIndex: 0,
    currentInstructionIndex: 0,
    evIdToBlockIndex: {},
};

function initScreenplayContext(blocks, textPool) {
    window.screenplayContext.blocks = blocks;
    window.screenplayContext.textPool = textPool || [];
    window.screenplayContext.currentBlockIndex = 0;
    window.screenplayContext.currentInstructionIndex = 0;
    window.screenplayContext.evIdToBlockIndex = {};
    
    blocks.forEach((block, i) => {
        const evId = block.evId;
        window.screenplayContext.evIdToBlockIndex[evId] = i;
    });
}

function getCurrentEvent() {
    return window.screenplayContext.blocks[window.screenplayContext.currentBlockIndex];
}

function getCurrentInstruction() {
    const currentEvent = getCurrentEvent();
    return currentEvent.instructions[window.screenplayContext.currentInstructionIndex];
}

function resolveStrings(instruction, textPool) {
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

function extractDialogData(lineText) {
    if (!lineText) {
        return { mode: 0, name: '', content: '' };
    }
    const match = lineText.match(/^\[(\d+)\](.+?):(.+)$/);
    if (match) {
        return {
            mode: parseInt(match[1]),
            name: match[2].trim(),
            content: match[3].trim()
        };
    }
    
    return { mode: 0, name: '', content: lineText };
}

function updateBlockIndex(eventBlock, returnValueIndex = 0) {
    const ctx = window.screenplayContext;
    const currentEvent = getCurrentEvent();

    if (ctx.currentInstructionIndex === currentEvent.instructions.length - 1) {
        const nextEvId = eventBlock.ReturnValues[returnValueIndex];
        ctx.currentBlockIndex = ctx.evIdToBlockIndex[nextEvId];
        ctx.currentInstructionIndex = 0;
        return;
    }
    
    ctx.currentInstructionIndex++;
}

function execUntilNextLine(decisionIndex = -1) {
    const ctx = window.screenplayContext;
    
    while (true) {
        if (decisionIndex !== -1) {
            const currentEvent = getCurrentEvent();
            updateBlockIndex(currentEvent, decisionIndex);
            decisionIndex = -1;
            window.scrPlayHandlers?.['ResetLineCounter']?.forEach(fn => fn());
            continue;
        }
        
        const currentEvent = getCurrentEvent();
        const instruction = getCurrentInstruction();
        console.log(`${ctx.currentInstructionIndex} / ${currentEvent.instructions.length} / ${instruction.type}`);
        
        const resolvedInstruction = {
            type: instruction.type,
            params: instruction.params,
            stringParams: resolveStrings(instruction, ctx.textPool)
        };
        
        window.scrPlayHandlers?.[instruction.type]?.forEach(fn => fn(resolvedInstruction));
        
        switch (resolvedInstruction.type) {
            case 'PlayDialog':
                updateBlockIndex(currentEvent);
                const lineText = resolvedInstruction.stringParams[0];
                const lineData = extractDialogData(lineText);
                window.scrPlayHandlers?.['PlayDialogInternal']?.forEach(fn => fn({
                    params: [lineData.mode],
                    stringParams: [lineData.content, lineData.name]
                }));
                return [lineData.content];

            case 'ShowDecision':
                const options = resolvedInstruction.stringParams.filter(s => s && s.length > 0);
                window.scrPlayHandlers?.['ShowDecisionInternal']?.forEach(fn => fn({
                    params: [],
                    stringParams: options
                }));
                return options;
        }
        
        updateBlockIndex(currentEvent);
    }
}

async function loadEvents() {
    try {
        const EventMappings = (await protobuf.load('/assets/events/events.proto'))
                                    .lookupType('events.EventMappings');
        const response = await fetch('/assets/events/events.pb');
        const arrayBuffer = await response.arrayBuffer();
        const decodedEvents = EventMappings.decode(new Uint8Array(arrayBuffer));
        window.EventMappings = EventMappings.toObject(decodedEvents, {
            enums: String,  // enums as string names
            defaults: true, // includes default values
        });

        console.log('Events loaded successfully!', window.EventMappings.events[0].instructions);

        // Initialize screenplay context with loaded data
        initScreenplayContext(
            window.EventMappings.events || [],
            window.EventMappings.textPool || []
        );

        console.log(execUntilNextLine());

        return window.EventMappings;
    } catch (error) {
        console.error('Error loading events:', error);
        throw error;
    }
}
