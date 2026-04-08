import { scheduleAutoContinueTimer, setAutoContinueTimeoutHandler, skipAutoContinueTimer } from "@/Core/AutoContinueTimer";
import { shakeScreen } from "@/Core/ScreenShakeComponent";
import { currentDate } from "@/Debug/DateDebugger";
import { type EventMapping } from "@/types/events";
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
    
    // We update lastInstruction indirectly by importing it, but since it's a let exported from another file inside an ES Module, 
    // it's better to export a setter or just use the imported setter.
    
    setLastInstruction(getCurrentInstruction());

    if (ScreenplayContext.currentInstructionIndex === currentEvent.instructions.length - 1) {
        console.log("Moving to next event block:", eventBlock);
        
        ScreenplayContext.passedEvIds.add(currentEvent.evId);

        let nextEvId = eventBlock.returnValues[returnValueIndex];

        if (!eventBlock.hasChoices && eventBlock.conditionalReturns && eventBlock.conditionalReturns.length > 0) {
            for (const cond of eventBlock.conditionalReturns) {
                const passedAll = cond.passedEvIds.every((id: number) => ScreenplayContext.passedEvIds.has(id));
                if (passedAll) {
                    console.log("Conditional return matched:", cond);
                    nextEvId = cond.returnValue;
                    break;
                }
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
                const lineText = resolvedInstruction.stringParams[0];
                const lineData = extractDialogData(lineText);
                dispatchEvent("PlayDialogInternal", {
                    params: [lineData[2], ScreenplayContext.currentBlockIndex, resolvedInstruction.params[1]],
                    stringParams: [lineData[0], lineData[1]],
                });
                return [lineData[0]]; // Returning dialog text essentially

            case "ShowDecision":
                const stringParams = resolvedInstruction.stringParams.filter((s: string) => s && s.length > 0);
                dispatchEvent("ShowDecisionInternal", {
                    params: [],
                    stringParams,
                });
                return stringParams;

            case "AutoContinue":
                updateBlockIndex(currentEvent);
                if (window.skipping) {
                    continue;
                }
                scheduleAutoContinueTimer((Number(resolvedInstruction.params[0]) || 0) * 3);
                return undefined;

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
