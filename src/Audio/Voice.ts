import { getCurrentBlockIndex, resolveLastInstruction, type Instruction } from "@/Core/Events";
import { extractDialogData, GetCharacterVoiceName, GetVoiceEventName } from "@/Utils/DialogHelper";
import { isAudioUnlocked } from "./🔓";

declare global {
    interface Window {
        PlayCurrentVoice: () => void;
    }
}

export function OnPlayDialog(instruction: Instruction) {
    if (instruction.params.length < 3) return;
    const voiceName = instruction.stringParams[0];
    const blockIndex = instruction.params[1];
    const lineCount = instruction.params[2];
    const voiceKey = GetCharacterVoiceName(voiceName);
    const eventName = GetVoiceEventName(blockIndex + 1);
    console.log(instruction);

    if (voiceName == "祐二" || !voiceKey) return;

    if (window.skipping) return;
    PlayCharacterVoice(voiceKey, eventName, lineCount.toString().padStart(3, "0"));
}

export function PlayCurrentVoice() {
    const instruction = resolveLastInstruction();
    if (!instruction || instruction.type !== "PlayDialog") return;
    const lineText = instruction.stringParams[0];
    const lineData = extractDialogData(lineText);
    const voiceName = lineData[0];
    const blockIndex = getCurrentBlockIndex();
    const voiceKey = GetCharacterVoiceName(voiceName);
    const eventName = GetVoiceEventName(blockIndex + 1);
    const lineCount = instruction.params[1];
    console.log("Playing current voice:", voiceName, eventName, lineCount, voiceKey);
    if (voiceName == "祐二" || !voiceKey) return;
    if (window.skipping) return;
    if (lineCount == null) return;
    PlayCharacterVoice(voiceKey, eventName, lineCount.toString().padStart(3, "0"));
}

const characterAudioElement = new Audio();

characterAudioElement.loop = false;
characterAudioElement.volume = 0.7;

function PlayCharacterVoice(characterKey: string, eventName: string, lineNumber: string) {
    if (!isAudioUnlocked()) {
        console.error("Audio locked");
        return;
    }
    characterAudioElement.pause();
    characterAudioElement.src = `/assets/audio/voice/${characterKey}.${eventName}.${lineNumber}.ogg`;
    characterAudioElement.play().catch(err => {
        console.warn("Play character voice failed:", err);
    });
}

document.addEventListener("PlayDialogInternal", (e: Event) => {
    OnPlayDialog((e as CustomEvent).detail);
});

window.PlayCurrentVoice = PlayCurrentVoice;
// When skipping stops, try to resume the current voice line
document.addEventListener("SkipModeEnded", () => {
    PlayCurrentVoice();
});
