function initScreenplayContext(blocks, textPool) {
    window.screenplayContext = {
        blocks: blocks || [],
        textPool: textPool || [],
        currentBlockIndex: 0,
        currentInstructionIndex: 0,
        evIdToBlockIndex: {},
    };
    
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

function extractDialogData(lineText)
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
    let content = lineText.substring(quoteIndex + 1, lineText.length - quoteIndex - 1).trim();
    if (candidate.length > 4 && candidate.startsWith("・・") && candidate.endsWith("・・")) {
        mode = 'Special';
        name = candidate.substring(2, candidate.length - 3).trim();
    } else if (candidate.length > 2 && candidate.startsWith("・") && candidate.endsWith("・")) {
        mode = 'Hidden';
        name = candidate.substring(1, candidate.length - 1).trim();
    }

    // 如果提取的名字不在角色列表中，则将整行作为内容并隐藏名字显示
    console.log(content, name);
    if (!window.AllowedCharacterNames.includes(name))
    {
        return ['', lineText, 'Hidden'];
    }

    return [name, content, mode];
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

function dispatchEvent(type, detail = {}) {
    document.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, cancelable: true }));
}

function execUntilNextLine(decisionIndex = -1) {
    const ctx = window.screenplayContext;
    
    while (true) {
        if (decisionIndex !== -1) {
            updateBlockIndex(getCurrentEvent(), decisionIndex);
            decisionIndex = -1;
            dispatchEvent('ResetLineCounter');
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
        
        dispatchEvent(instruction.type, resolvedInstruction);
        
        switch (resolvedInstruction.type) {
            case 'PlayDialog':
                updateBlockIndex(currentEvent);
                const lineText = resolvedInstruction.stringParams[0];
                const lineData = extractDialogData(lineText);
                console.log(lineText)
                dispatchEvent('PlayDialogInternal', {
                    params: [lineData[2]],
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

        return window.EventMappings;
    } catch (error) {
        console.error('Error loading events:', error);
        throw error;
    }
}
