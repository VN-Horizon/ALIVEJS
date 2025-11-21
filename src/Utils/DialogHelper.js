import { AllowedCharacterNames } from '../Constants.js';
import { CharacterNameToVoiceKey } from '../Constants.js';

export function extractDialogData(lineText)
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