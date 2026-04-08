import { shakeScreen } from "@/Core/ScreenShakeComponent";
import { currentDate } from "@/Debug/DateDebugger";
import { type EventMapping } from "@/types/events";
import { scheduleAutoContinueTimer, setAutoContinueTimeoutHandler, skipAutoContinueTimer } from "@/Utils/AutoContinueTimer";
import { extractDialogData } from "@/Utils/DialogHelper";
import { resolveCurrentInstruction } from "./InstructionResolver";
import { getCurrentEvent, getCurrentInstruction, ScreenplayContext, setLastInstruction } from "./ScreenplayState";

setAutoContinueTimeoutHandler(() => execUntilNextLine());

export function skipAutoContinueWait(): boolean {
    return skipAutoContinueTimer() ? (execUntilNextLine(), true) : false;
}

function dispatchEvent(type: string, detail: any = {}): void {
    document.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, cancelable: true }));
}

function updateBlockIndex(eventBlock: EventMapping, returnValueIndex: number = 0): void {
    const currentEvent = getCurrentEvent();
    
    setLastInstruction(getCurrentInstruction());

    if (ScreenplayContext.currentInstructionIndex === currentEvent.instructions.length - 1) {
        console.log("Moving to next event block:", eventBlock);
        
        ScreenplayContext.passedEvIds.add(currentEvent.evId);

        let nextEvId = eventBlock.returnValues[returnValueIndex];

        if (!eventBlock.hasChoices) {
            const matchedCond = eventBlock.conditionalReturns?.find(cond =>
                cond.passedEvIds.every(id => ScreenplayContext.passedEvIds.has(id))
            );
            if (matchedCond) {
                console.log("Conditional return matched:", matchedCond);
                nextEvId = matchedCond.returnValue;
            }
        }

        ScreenplayContext.currentBlockIndex = ScreenplayContext.evIdToBlockIndex[nextEvId];
        ScreenplayContext.currentInstructionIndex = 0;
        return;
    }

    ScreenplayContext.currentInstructionIndex++;
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
            `${currentDate}/B${getCurrentEvent().evId}/${ScreenplayContext.currentInstructionIndex}(${currentEvent.instructions.length})/${currentEvent.evFunc}:`,
            resolvedInstruction,
        );

        if (!resolvedInstruction) break;

        dispatchEvent(instruction.type, resolvedInstruction);

        switch (resolvedInstruction.type) {
            case "PlayDialog":
                updateBlockIndex(currentEvent);
                const [text, voice, prm2] = extractDialogData(resolvedInstruction.stringParams[0]);
                dispatchEvent("PlayDialogInternal", { params: [prm2, ScreenplayContext.currentBlockIndex, resolvedInstruction.params[1]], stringParams: [text, voice] });
                return [text];

            case "ShowDecision":
                const choices = resolvedInstruction.stringParams.filter(Boolean);
                dispatchEvent("ShowDecisionInternal", { params: [], stringParams: choices });
                return choices;

            case "AutoContinue":
                updateBlockIndex(currentEvent);
                if (window.skipping) {
                    continue;
                }
                scheduleAutoContinueTimer((Number(resolvedInstruction.params[0]) || 0) * 3);
                return;

            case "ShakeScreen":
                shakeScreen(Number(resolvedInstruction.params[0]) || 0);
                updateBlockIndex(currentEvent);
                break;
        }

        updateBlockIndex(currentEvent);
    }
    return undefined;
}

// @ts-expect-error - CustomEvent type
document.addEventListener("MakeDecisionInternal", (e: CustomEvent) => {
    const decisionIndex = e.detail.params[0];
    execUntilNextLine(decisionIndex);
});
