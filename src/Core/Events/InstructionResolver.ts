import { type EventInstruction, type ResolvedEventInstruction } from "@/types/events";
import { getCurrentInstruction, lastInstruction, ScreenplayContext } from "./ScreenplayState";

export function resolveStrings(instruction: EventInstruction | null, textPool: string[]): string[] {
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

export function resolveLastInstruction(): ResolvedEventInstruction | null {
    const instruction = lastInstruction;
    if (!instruction) return null;
    return {
        type: instruction.type,
        params: instruction.params,
        stringParams: resolveStrings(instruction, ScreenplayContext.textPool),
    };
}

export function resolveCurrentInstruction(): ResolvedEventInstruction | null {
    const instruction = getCurrentInstruction();
    if (!instruction) return null;
    return {
        type: instruction.type,
        params: instruction.params,
        stringParams: resolveStrings(instruction, ScreenplayContext.textPool),
    };
}
