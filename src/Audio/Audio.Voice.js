import { isAudioUnlocked } from './Audio.🔓.js';
import { CharacterNameToVoiceKey } from '../Constants.js';

export const CharacterLineCounts = {};

function GetVoiceEventName(index) {
    var currentIndex = (index).toString().padStart(4, '0');
    return `REN${currentIndex}`;
}

function GetCharacterVoiceName(characterName) {
    if (!CharacterNameToVoiceKey[characterName]) return "";
    var voiceKey = CharacterNameToVoiceKey[characterName];
    if (!voiceKey) return "";
    return voiceKey;
}


export function OnPlayDialog(instruction)
{
    var voiceName = instruction.stringParams[1];
    var blockIndex = instruction.params[0];
    var voiceKey = GetCharacterVoiceName(voiceName);
    var eventName = GetVoiceEventName(blockIndex + 1);

    if (voiceName == "祐二" || !voiceKey) return;

    // Initialize line count if character hasn't spoken yet
    CharacterLineCounts[voiceKey] = (CharacterLineCounts[voiceKey] || 0) + 1;

    var lineCount = CharacterLineCounts[voiceKey];

    PlayCharacterVoice(voiceKey, eventName, lineCount.toString().padStart(3, '0'));

    // Increment line count after playing
    CharacterLineCounts[voiceKey]++;
}


const characterAudioElement = new Audio();
let isCharacterAudioPlaying = false;

characterAudioElement.loop = false;
characterAudioElement.volume = 0.7;

function PlayCharacterVoice(characterKey, eventName, lineNumber) {
    if (!isAudioUnlocked()) {
        console.error('Audio locked');
        return;
    }
    characterAudioElement.pause();
    characterAudioElement.src = `/assets/audio/voice/${characterKey}.${eventName}.${lineNumber}.mp3`;
    isCharacterAudioPlaying = true;
    characterAudioElement.play().catch(err => {
        console.warn('Play character voice failed:', err);
    });
}
