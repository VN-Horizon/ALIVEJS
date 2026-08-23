import { shakeScreen } from "@/Core/ScreenShakeComponent";
import { currentDate } from "@/Debug/DateDebugger";
import { type EventMapping } from "@/types/events";
import {
  scheduleAutoContinueTimer,
  setAutoContinueTimeoutHandler,
  skipAutoContinueTimer,
} from "@/Utils/AutoContinueTimer";
import { extractDialogData } from "@/Utils/DialogHelper";
import { getProgress, incProgress } from "../Save/Progress";
import { resolveInstruction } from "./InstructionResolver";
import {
  getCurrentEvent,
  getCurrentInstruction,
  ScreenplayContext,
  setLastInstruction,
} from "./ScreenplayState";

setAutoContinueTimeoutHandler(() => execUntilNextLine());

export function skipAutoContinueWait(): boolean {
  if (skipAutoContinueTimer()) {
    execUntilNextLine();
    return true;
  }
  return false;
}

let oneShotDispatchDelays: Partial<Record<string, number>> = {};
let pendingDelayedDispatches = 0;

export function setOneShotDispatchDelays(delays: Partial<Record<string, number>>): void {
  oneShotDispatchDelays = { ...delays };
}

function dispatchEvent(type: string, detail: any = {}): void {
  const delay = oneShotDispatchDelays[type];
  if (delay !== undefined) {
    delete oneShotDispatchDelays[type];
    if (delay > 0) {
      pendingDelayedDispatches++;
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, cancelable: true }));
        pendingDelayedDispatches--;
        if (pendingDelayedDispatches <= 0) {
          pendingDelayedDispatches = 0;
          oneShotDispatchDelays = {};
        }
      }, delay);
      return;
    }
  }
  document.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, cancelable: true }));
}

function updateBlockIndex(currentEvent: EventMapping, returnValueIndex: number = 0): void {
  if (currentEvent.instructions && currentEvent.instructions.length > 0) {
    setLastInstruction(getCurrentInstruction(currentEvent));
  }

  if (
    !currentEvent.instructions ||
    currentEvent.instructions.length === 0 ||
    ScreenplayContext.currentInstructionIndex === currentEvent.instructions.length - 1
  ) {
    console.log("Moving to next event block:", currentEvent);

    ScreenplayContext.passedEvIds.add(currentEvent.evId);

    let nextEvId = currentEvent.returnValues[returnValueIndex];

    if (!currentEvent.hasChoices) {
      const matchedCond = currentEvent.conditionalReturns?.find((cond) =>
        cond.passedEvIds.every((id) => {
          if (id < 0) {
            return getProgress()[-id] > 0;
          }
          return ScreenplayContext.passedEvIds.has(id);
        })
      );
      if (matchedCond) {
        console.log("Conditional return matched:", matchedCond);
        nextEvId = matchedCond.returnValue;
      }
    }
    if (nextEvId === 7090644) location.reload();

    ScreenplayContext.currentEvId = nextEvId;
    ScreenplayContext.currentBlockIndex = ScreenplayContext.evIdToBlockIndex[nextEvId];
    ScreenplayContext.currentInstructionIndex = 0;
    return;
  }

  ScreenplayContext.currentInstructionIndex++;
}

export function execUntilNextLine(decisionIndex: number = -1): string[] | undefined {
  if (pendingDelayedDispatches > 0) return undefined;

  while (true) {
    if (decisionIndex !== -1) {
      const currentEvent = getCurrentEvent();
      updateBlockIndex(currentEvent, decisionIndex);
      decisionIndex = -1;
      continue;
    }

    const currentEvent = getCurrentEvent();

    if (!currentEvent.instructions || currentEvent.instructions.length === 0) {
      updateBlockIndex(currentEvent);
      continue;
    }

    const instruction = getCurrentInstruction(currentEvent);
    const resolvedInstruction = resolveInstruction(instruction);
    console.log(
      `${currentDate}/B${currentEvent.evId}/${ScreenplayContext.currentInstructionIndex}(${currentEvent.instructions.length})/${currentEvent.evFunc}:`,
      resolvedInstruction
    );

    if (!resolvedInstruction) break;

    dispatchEvent(instruction.type, resolvedInstruction);

    switch (resolvedInstruction.type) {
      case "PlayDialog": {
        const lineBlockIndex = ScreenplayContext.currentBlockIndex;
        const lineInstructionIndex = ScreenplayContext.currentInstructionIndex;
        updateBlockIndex(currentEvent);
        const [text, voice, prm2] = extractDialogData(resolvedInstruction.stringParams[0]);
        dispatchEvent("PlayDialogInternal", {
          params: [prm2, lineBlockIndex, resolvedInstruction.params[1], lineInstructionIndex],
          stringParams: [text, voice],
        });
        return [text];
      }

      case "ShowDecision":
        const choices = resolvedInstruction.stringParams.filter(Boolean);
        dispatchEvent("ShowDecisionInternal", { params: [], stringParams: choices });
        return choices;

      case "AutoContinue":
        updateBlockIndex(currentEvent);
        if (window.skipping) {
          scheduleAutoContinueTimer(50);
          return;
        }
        scheduleAutoContinueTimer((Number(resolvedInstruction.params[0]) || 0) * 3);
        return;

      case "IncMemory":
        incProgress(Number(resolvedInstruction.params[0]) || 0);
        updateBlockIndex(currentEvent);
        break;

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
