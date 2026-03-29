import * as ogvModule from "ogv";
import { isAudioUnlocked } from "./🔓";

const ogvRuntime = (
    (ogvModule as unknown as { default?: unknown }).default ?? ogvModule
) as {
    OGVLoader: { base: string };
    OGVPlayer: new () => HTMLMediaElement;
};

if (!ogvRuntime?.OGVLoader || !ogvRuntime?.OGVPlayer) {
    throw new Error("ogv runtime did not expose OGVLoader/OGVPlayer");
}

ogvRuntime.OGVLoader.base = "/ogv";

const seList: { [key: string]: HTMLMediaElement } = {};
let currentSE: HTMLMediaElement | null = null;

function attachHiddenPlayer(player: HTMLMediaElement) {
    player.style.display = "none";
    if (document.body) {
        document.body.appendChild(player as unknown as Node);
        return;
    }

    window.addEventListener(
        "DOMContentLoaded",
        () => {
            document.body.appendChild(player as unknown as Node);
        },
        { once: true },
    );
}

export function initSE() {
    for (let i = 1; i < 37; i++) {
        const audioElement = new ogvRuntime.OGVPlayer();
        audioElement.src = `/assets/audio/se/SE_${i.toString().padStart(2, "0")}.ogg`;
        audioElement.loop = false;
        audioElement.volume = 0.5;
        attachHiddenPlayer(audioElement);
        const trackName = `se_${i.toString().padStart(2, "0")}`;
        seList[trackName] = audioElement;
    }
    console.log("SE initialized");
}

export function playSE(name: string) {
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
        const playPromise = currentSE.play() as unknown as Promise<void> | undefined;
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                if (err.name !== "AbortError") {
                    console.warn("Play SE failed:", err);
                }
            });
        }
    }
}

document.addEventListener("PlaySe", (e: Event) => {
    if (window.skipping) return;
    playSE((e as CustomEvent).detail.stringParams[0]);
});
