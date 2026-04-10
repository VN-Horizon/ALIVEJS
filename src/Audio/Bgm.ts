import { loadSettings } from "@/Core/Settings";
import { createAudioPlayer } from "./AudioPlayer";
import { queueIfLocked } from "./🔓";

const bgmList: { [key: string]: HTMLMediaElement } = {};
let currentBGM: HTMLMediaElement | null = null;
let currentBGMName: string | null = null;

const settings = loadSettings();
const calculateVolume = (baseVol: number, useSystem: boolean) => {
  return useSystem ? baseVol / 100 : baseVol / 100; // simplify for now
};
const TARGET_VOLUME = calculateVolume(settings.bgmVolume, settings.bgmUseSystem);

const FADE_DURATION = 1000;
let fadeInterval: number | null = null;
const currentlyFadingAudios = new Set<HTMLMediaElement>();

function performCrossfade(oldAudio: HTMLMediaElement | null, newAudio: HTMLMediaElement | null) {
  if (fadeInterval) {
    clearInterval(fadeInterval);
    fadeInterval = null;
  }

  // Stop any audios that were previously fading but haven't finished
  for (const fadingAudio of currentlyFadingAudios) {
    fadingAudio.pause();
    fadingAudio.currentTime = 0;
  }
  currentlyFadingAudios.clear();

  if (!settings.bgmFade) {
    if (oldAudio) {
      oldAudio.pause();
      oldAudio.currentTime = 0;
      oldAudio.volume = TARGET_VOLUME;
    }
    if (newAudio) {
      newAudio.volume = TARGET_VOLUME;
      newAudio.play().catch(() => {});
    }
    return;
  }

  if (oldAudio) currentlyFadingAudios.add(oldAudio);

  if (oldAudio && !newAudio) {
    let vol = TARGET_VOLUME;
    fadeInterval = window.setInterval(() => {
      vol -= TARGET_VOLUME / (FADE_DURATION / 50);
      if (vol <= 0) {
        vol = 0;
        clearInterval(fadeInterval!);
        oldAudio.pause();
        oldAudio.currentTime = 0;
        currentlyFadingAudios.delete(oldAudio);
      }
      if (!isNaN(vol)) oldAudio.volume = vol;
    }, 50);
  } else if (!oldAudio && newAudio) {
    newAudio.volume = 0;
    newAudio.play().catch(() => {});
    let vol = 0;
    fadeInterval = window.setInterval(() => {
      vol += TARGET_VOLUME / (FADE_DURATION / 50);
      if (vol >= TARGET_VOLUME) {
        vol = TARGET_VOLUME;
        clearInterval(fadeInterval!);
      }
      if (!isNaN(vol)) newAudio.volume = vol;
    }, 50);
  } else if (oldAudio && newAudio) {
    oldAudio.volume = TARGET_VOLUME;
    newAudio.volume = 0;
    newAudio.play().catch(() => {});
    let progress = 0;
    fadeInterval = window.setInterval(() => {
      progress += 50 / FADE_DURATION;
      if (progress >= 1) {
        progress = 1;
        clearInterval(fadeInterval!);
        oldAudio.pause();
        oldAudio.currentTime = 0;
        currentlyFadingAudios.delete(oldAudio);
      }
      if (!isNaN(progress)) {
        oldAudio.volume = TARGET_VOLUME * Math.max(0, 1 - progress);
        newAudio.volume = TARGET_VOLUME * Math.min(1, progress);
      }
    }, 50);
  }
}

export function initBGM() {
  for (let i = 0; i < 22; i++) {
    const audioElement = createAudioPlayer();
    audioElement.src = `/assets/audio/bgm/M${i.toString().padStart(2, "0")}.ogg`;
    audioElement.loop = true;
    audioElement.volume = TARGET_VOLUME;
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
  if (currentBGMName === name) return; // Already playing

  const previousBGM = currentBGM;
  currentBGMName = name;
  currentBGM = bgmList[name];

  performCrossfade(previousBGM, currentBGM);
}

export function getCurrentBGM(): string | null {
  console.log("Current BGM:", currentBGMName);
  return currentBGMName;
}

export function stopBGM() {
  if (currentBGM) {
    performCrossfade(currentBGM, null);
    currentBGMName = null;
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
