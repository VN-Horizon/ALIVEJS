import { getCurrentBlockIndex, resolveLastInstruction, type Instruction } from "../Core/Events";
import { extractDialogData, GetCharacterVoiceName, GetVoiceEventName } from "../Utils/DialogHelper";
import { isAudioUnlocked } from "./🔓";

declare global {
    interface Window {
        PlayCurrentVoice: () => void;
    }
}

export function OnPlayDialog(instruction: Instruction) {
    if (instruction.params.length < 3) return;
    var voiceName = instruction.stringParams[0];
    var blockIndex = instruction.params[1];
    var lineCount = instruction.params[2];
    var voiceKey = GetCharacterVoiceName(voiceName);
    var eventName = GetVoiceEventName(blockIndex + 1);
    console.log(instruction);

    if (voiceName == "祐二" || !voiceKey) return;

    if (window.skipping === true) return;
    PlayCharacterVoice(voiceKey, eventName, lineCount.toString().padStart(3, "0"));
}

export function PlayCurrentVoice() {
    const instruction = resolveLastInstruction();
    if (!instruction || instruction.type !== "PlayDialog") return;
    const lineText = instruction.stringParams[0];
    const lineData = extractDialogData(lineText);
    var voiceName = lineData[0];
    var blockIndex = getCurrentBlockIndex();
    var voiceKey = GetCharacterVoiceName(voiceName);
    var eventName = GetVoiceEventName(blockIndex + 1);
    var lineCount = instruction.params[1];
    console.log("Playing current voice:", voiceName, eventName, lineCount, voiceKey);
    if (voiceName == "祐二" || !voiceKey) return;
    if (window.skipping === true) return;
    if (lineCount == null) return;
    PlayCharacterVoice(voiceKey, eventName, lineCount.toString().padStart(3, "0"));
}

const characterAudioElement = new Audio();
let isCharacterAudioPlaying = false;

characterAudioElement.loop = false;
characterAudioElement.volume = 0.7;

function PlayCharacterVoice(characterKey: string, eventName: string, lineNumber: string) {
    if (!isAudioUnlocked()) {
        console.error("Audio locked");
        return;
    }
    characterAudioElement.pause();
    characterAudioElement.src = `/assets/audio/voice/${characterKey}.${eventName}.${lineNumber}.ogg`;
    isCharacterAudioPlaying = true;
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
