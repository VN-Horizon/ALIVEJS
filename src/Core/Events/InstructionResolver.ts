import { type EventInstruction, type ResolvedEventInstruction } from "@/types/events";
import { lastInstruction, ScreenplayContext } from "./ScreenplayState";

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
  return resolveInstruction(lastInstruction);
}

export function resolveInstruction(
  instruction: EventInstruction | null
): ResolvedEventInstruction | null {
  if (!instruction) return null;
  return {
    type: instruction.type,
    params: instruction.params,
    stringParams: resolveStrings(instruction, ScreenplayContext.textPool),
  };
}
