import { AllowedCharacterNames } from '../Constants.js';
import { CharacterNameToVoiceKey } from '../Constants.js';

function plainizeText(text) {
    if (text === undefined || text === null) return '';
    return String(text).replace(/\s+/g, '');
}

export function extractDialogData(lineText)
{
    let [name, content, mode] = internalExtractDialogData(lineText);
    const plainKey = plainizeText(content);
    console.log(plainKey)
    if (window.translationPlainMap && window.translationPlainMap[plainKey]) {
        content = window.translationPlainMap[plainKey];
    }
    return [name, content, mode];
}

export function internalExtractDialogData(lineText)
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
    let closingQuoteIndex = lineText.lastIndexOf('」');
    let content = closingQuoteIndex > quoteIndex 
        ? lineText.substring(quoteIndex + 1, closingQuoteIndex).trim()
        : lineText.substring(quoteIndex + 1).trim();
    if (candidate.length > 4 && candidate.startsWith("・・") && candidate.endsWith("・・")) {
        mode = 'Special';
        name = candidate.substring(2, candidate.length - 3).trim();
    } else if (candidate.length > 2 && candidate.startsWith("・") && candidate.endsWith("・")) {
        mode = 'Hidden';
        name = candidate.substring(1, candidate.length - 1).trim();
    }

    // 如果提取的名字不在角色列表中，则将整行作为内容并隐藏名字显示
    if (!AllowedCharacterNames.includes(name))
    {
        return ['', lineText, 'Hidden'];
    }


    return [name, content, mode];
}


export function GetVoiceEventName(index) {
    var currentIndex = (index).toString().padStart(4, '0');
    return `REN${currentIndex}`;
}

export function GetCharacterVoiceName(characterName) {
    if (!CharacterNameToVoiceKey[characterName]) return "";
    var voiceKey = CharacterNameToVoiceKey[characterName];
    if (!voiceKey) return "";
    return voiceKey;
}

export async function loadAndTranslateFileFromUrl(url) {
    if (!url) {
        console.error("No URL provided.");
        return;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error("Failed to fetch file:", response.statusText);
            return;
        }
        const buffer = await response.arrayBuffer();
        const dataView = new DataView(buffer);
        const map = {};
        const plainMap = {};
        let offset = 0;

        while (offset < buffer.byteLength) {
            // Read the length of the first string
            const _secondLength = dataView.getUint32(offset, true);
            offset += 4;

            // Read the first string
            const _secondString = new TextDecoder('utf-8').decode(
                new Uint8Array(buffer, offset, _secondLength)
            );
            offset += _secondLength;

            // Read the length of the second string
            const thirdLength = dataView.getUint32(offset, true);
            offset += 4;

            // Read the second string
            const thirdString = new TextDecoder('utf-8').decode(
                new Uint8Array(buffer, offset, thirdLength)
            );
            offset += thirdLength;

            map[_secondString] = thirdString;
            const keyPlain = plainizeText(_secondString);
            if (offset < 1000) {
                console.log(`Key: "${keyPlain}" => "${thirdString}"`);
            }
            if (keyPlain.length > 0) {
                plainMap[keyPlain] = thirdString;
            }
        }
        // console.log("Translation map loaded:", map);
        window.translationMap = map; // Store globally for access in other parts of the application
        window.translationPlainMap = plainMap; // Normalized lookup by whitespace-insensitive key
        return map;
    } catch (err) {
        console.error("Error loading or parsing binary file:", err);
    }
}

// Example usage:
loadAndTranslateFileFromUrl("./assets/events/translation.bin");