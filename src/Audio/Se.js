import { isAudioUnlocked } from "./🔓.js";

const seList = {};
let currentSE = null;

export function initSE() {
    for (let i = 1; i < 37; i++) {
        const audioElement = new Audio(`/assets/audio/se/SE_${i.toString().padStart(2, "0")}.mp3`);
        audioElement.loop = false;
        audioElement.volume = 0.5;
        const trackName = `se_${i.toString().padStart(2, "0")}`;
        seList[trackName] = audioElement;
    }
    console.log("SE initialized");
}

export function playSE(name) {
    if (!isAudioUnlocked()) {
        console.error("Audio locked");
        return;
    }
    if (currentSE) {
        currentSE.pause();
        currentSE.currentTime = 0;
    }
    currentSE = seList[name];
    if (currentSE) {
        currentSE.play().catch(err => {
            console.warn("Play SE failed:", err);
        });
    }
}

document.addEventListener("PlaySe", e => {
    if (window.skipping === true) return;
    playSE(e.detail.stringParams[0]);
});
