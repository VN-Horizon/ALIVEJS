import { isAudioUnlocked } from "./🔓.js";

const bgmList = {};
let currentBGM = null;
let currentBGMName = null;

export function initBGM() {
    for (let i = 0; i < 22; i++) {
        const audioElement = new Audio(`/assets/audio/bgm/M${i.toString().padStart(2, "0")}.mp3`);
        audioElement.loop = true;
        audioElement.volume = 0.5;
        const trackName = `M${i.toString().padStart(2, "0")}`;
        bgmList[trackName] = audioElement;
    }
    console.log("BGM initialized");
}

export function playBGM(name) {
    if (!isAudioUnlocked()) {
        console.error("Audio locked");
        return;
    }
    if (currentBGM) {
        currentBGM.pause();
        currentBGM.currentTime = 0;
    }
    currentBGMName = name;
    currentBGM = bgmList[name];
    if (currentBGM) {
        currentBGM.play().catch(err => {
            console.warn("Play BGM failed:", err);
        });
    }
}

export function getCurrentBGM() {
    console.log("Current BGM:", currentBGMName);
    return currentBGMName;
}

export function stopBGM() {
    if (currentBGM) {
        currentBGM.pause();
        currentBGM.currentTime = 0;
        currentBGM = null;
    }
}

document.addEventListener("PlayBgm", e => {
    const { stringParams } = e.detail;
    if (stringParams.length >= 1) {
        playBGM(stringParams[0]);
    } else {
        stopBGM();
    }
});
