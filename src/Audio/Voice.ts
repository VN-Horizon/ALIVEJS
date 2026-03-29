import { getCurrentBlockIndex, resolveLastInstruction, type Instruction } from "@/Core/Events";
import { extractDialogData, GetCharacterVoiceName, GetVoiceEventName } from "@/Utils/DialogHelper";
import protobuf from "protobufjs";
import { createAudioPlayer } from "./AudioPlayer";
import { queueIfLocked } from "./🔓";

interface VoiceInfo {
    bank: string;
    time: number;
    duration: number;
}

interface PreloadInfo {
    bank: string[];
}

interface VoiceMappings {
    version?: string;
    voices: Record<string, VoiceInfo>;
    preloadBlocks: Record<string, PreloadInfo>;
}

const player = createAudioPlayer();
player.loop = false;
player.volume = 0.7;
player.addEventListener("ended", () => {
    isPlayingCurrentVoice = false;
});

let activeSegmentTimer: number | null = null;
let lastPreloadedChapter: string | null = null;

const bankUrlCache = new Map<string, string>();
let voiceMappings: VoiceMappings | null = null;
const voiceMappingPromise = loadVoiceMappings();

function clearActiveSegmentTimer() {
    if (activeSegmentTimer != null) {
        window.clearTimeout(activeSegmentTimer);
        activeSegmentTimer = null;
    }
}

let currentPlayingVoiceId: string | null = null;
let isPlayingCurrentVoice = false;

export function getCurrentPlayingVoiceId() {
    if (!isPlayingCurrentVoice) return null;
    return currentPlayingVoiceId;
}

export function stopCurrentVoice() {
    clearActiveSegmentTimer();
    player.pause();
    isPlayingCurrentVoice = false;
    currentPlayingVoiceId = null;
}

export function getVoiceKey(characterName: string, eventName: string, lineNumber: string) {
    const voiceKey = GetCharacterVoiceName(characterName);
    if (!voiceKey) return null;
    return `${voiceKey}.${eventName}.${lineNumber}`;
}

async function loadVoiceMappings(): Promise<VoiceMappings | null> {
    try {
        const root = await protobuf.load("/assets/events/voice_mapping.proto");
        const VoiceMappingsType = root.lookupType("voice_mapping.VoiceMappings");
        const response = await fetch("/assets/events/voice_mapping.pb");
        if (!response.ok) {
            throw new Error(`Failed to load voice mapping: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const decoded = VoiceMappingsType.decode(new Uint8Array(arrayBuffer));
        const mappingObj = VoiceMappingsType.toObject(decoded, {
            defaults: true,
        }) as VoiceMappings;

        voiceMappings = {
            version: mappingObj.version,
            voices: mappingObj.voices || {},
            preloadBlocks: mappingObj.preloadBlocks || {},
        };

        console.log("Voice mapping loaded:", {
            version: voiceMappings.version,
            voices: Object.keys(voiceMappings.voices).length,
            preloadBlocks: Object.keys(voiceMappings.preloadBlocks).length,
        });

        return voiceMappings;
    } catch (error) {
        console.warn("Unable to load voice mapping, fallback to legacy playback.", error);
        voiceMappings = null;
        return null;
    }
}

async function preloadBank(bankFileName: string): Promise<string> {
    const cached = bankUrlCache.get(bankFileName);
    if (cached) return cached;

    const response = await fetch(`/assets/audio/voice/${bankFileName}`);
    if (!response.ok) {
        throw new Error(`Failed to preload voice bank ${bankFileName}: ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    bankUrlCache.set(bankFileName, blobUrl);
    return blobUrl;
}

async function preloadBanksForChapter(chapterName: string) {
    const mappings = await voiceMappingPromise;
    if (!mappings) return;
    if (lastPreloadedChapter === chapterName) return;

    const preloadInfo = mappings.preloadBlocks[chapterName];
    if (!preloadInfo?.bank?.length) {
        lastPreloadedChapter = chapterName;
        return;
    }

    await Promise.all(
        preloadInfo.bank.map(async bankName => {
            try {
                await preloadBank(bankName);
            } catch (error) {
                console.warn(`Failed to preload voice bank: ${bankName}`, error);
            }
        }),
    );

    lastPreloadedChapter = chapterName;
}

async function playMappedVoice(voiceId: string) {
    const mappings = await voiceMappingPromise;
    if (!mappings) return false;

    const info = mappings.voices[voiceId];
    if (!info) return false;

    const sourceUrl = await preloadBank(info.bank);

    stopCurrentVoice();
    if (player.src !== sourceUrl) {
        player.src = sourceUrl;
    }

    const startTime = Math.max(0, info.time || 0);
    const duration = Math.max(0, info.duration || 0);
    const endTime = startTime + duration;

    try {
        player.currentTime = startTime;
    } catch {
        // Some environments reject immediate seeks before metadata is ready; play fallback still works.
    }

    try {
        const playPromise = player.play() as unknown as Promise<void> | undefined;
        if (playPromise !== undefined) {
            await playPromise;
        }
    } catch (error: any) {
        if (error?.name !== "AbortError") {
            console.warn("Play mapped voice failed:", error);
        }
        return false;
    }

    if (duration > 0) {
        activeSegmentTimer = window.setTimeout(() => {
            if (player.currentTime >= endTime - 0.03) {
                player.pause();
                isPlayingCurrentVoice = false;
                return;
            }
            player.pause();
            isPlayingCurrentVoice = false;
        }, duration * 1000);
    }

    return true;
}

export async function playCharacterVoice(characterName: string, eventName: string, lineNumber: string) {
    if (queueIfLocked(() => { void playCharacterVoice(characterName, eventName, lineNumber); })) {
        console.error("Audio locked, queueing voice.");
        return;
    }

    await preloadBanksForChapter(eventName);

    const voiceId = getVoiceKey(characterName, eventName, lineNumber);
    if (!voiceId) return;

    const playedMapped = await playMappedVoice(voiceId);
    isPlayingCurrentVoice = playedMapped;
    if (playedMapped) {
        currentPlayingVoiceId = voiceId;
    } else {
        console.warn(`No mapping found for voice ${voiceId}, or playback failed.`);
    }
}

export function OnPlayDialog(instruction: Instruction) {
    if (instruction.params.length < 3) return;
    const voiceName = instruction.stringParams[0];
    const blockIndex = instruction.params[1];
    const lineCount = instruction.params[2];
    const eventName = GetVoiceEventName(blockIndex + 1);
    if (voiceName == "祐二") return;

    if (window.skipping) return;
    void playCharacterVoice(voiceName, eventName, lineCount.toString().padStart(3, "0"));
}

export function PlayCurrentVoice() {
    const instruction = resolveLastInstruction();
    if (!instruction || instruction.type !== "PlayDialog") return;
    const lineText = instruction.stringParams[0];
    const lineData = extractDialogData(lineText);
    const voiceName = lineData[0];
    const blockIndex = getCurrentBlockIndex();
    const eventName = GetVoiceEventName(blockIndex + 1);
    const lineCount = instruction.params[1];
    if (voiceName == "祐二") return;
    if (window.skipping) return;
    if (lineCount == null) return;
    void playCharacterVoice(voiceName, eventName, lineCount.toString().padStart(3, "0"));
}

document.addEventListener("PlayDialogInternal", (e: Event) => {
    OnPlayDialog((e as CustomEvent).detail);
});

// When skipping stops, try to resume the current voice line
document.addEventListener("SkipModeEnded", () => {
    PlayCurrentVoice();
});
