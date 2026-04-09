import { createAudioPlayer } from "./AudioPlayer";
import { queueIfLocked } from "./🔓";

const bgmList: { [key: string]: HTMLMediaElement } = {};
let currentBGM: HTMLMediaElement | null = null;
let currentBGMName: string | null = null;

export function initBGM() {
    for (let i = 0; i < 22; i++) {
        const audioElement = createAudioPlayer();
        audioElement.src = `/assets/audio/bgm/M${i.toString().padStart(2, "0")}.ogg`;
        audioElement.loop = true;
        audioElement.volume = 0.5;
        const trackName = `M${i.toString().padStart(2, "0")}`;
        bgmList[trackName] = audioElement;
    }
    console.log("BGM initialized");
}

export function playBGM(name: string) {
    if (queueIfLocked(() => playBGM(name))) {
        console.warn("Audio locked, queueing BGM:", name);
        return;
    }
    if (currentBGM) {
        currentBGM.pause();
        currentBGM.currentTime = 0;
    }
    currentBGMName = name;
    currentBGM = bgmList[name];
    if (currentBGM) {
        const playPromise = currentBGM.play() as unknown as Promise<void> | undefined;
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                if (err.name !== "AbortError") {
                    console.warn("Play BGM failed:", err);
                }
            });
        }
    }
}

export function getCurrentBGM(): string | null {
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

document.addEventListener("PlayBgm", (e: Event) => {
    const { stringParams } = (e as CustomEvent).detail;
    if (stringParams.length >= 1) {
        playBGM(stringParams[0]);
    } else {
        stopBGM();
    }
});
