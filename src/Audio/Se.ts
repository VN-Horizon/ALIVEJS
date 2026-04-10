import { loadSettings } from "@/Core/Settings";
import { createAudioPlayer } from "./AudioPlayer";
import { queueIfLocked } from "./🔓";

const seList: { [key: string]: HTMLMediaElement } = {};
let currentSE: HTMLMediaElement | null = null;

const settings = loadSettings();
const calculateVolume = (baseVol: number, useSystem: boolean) => {
  return useSystem ? baseVol / 100 : baseVol / 100;
};
const TARGET_VOLUME = calculateVolume(settings.seVolume, settings.seUseSystem);

export function initSE() {
  for (let i = 1; i < 37; i++) {
    const audioElement = createAudioPlayer();
    audioElement.src = `/assets/audio/se/SE_${i.toString().padStart(2, "0")}.ogg`;
    audioElement.loop = false;
    audioElement.volume = TARGET_VOLUME;
    const trackName = `se_${i.toString().padStart(2, "0")}`;
    seList[trackName] = audioElement;
  }
  console.log("SE initialized");
}

export function playSE(name: string) {
  if (queueIfLocked(() => playSE(name))) {
    console.error("Audio locked, queueing SE:", name);
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
      playPromise.catch((err) => {
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
