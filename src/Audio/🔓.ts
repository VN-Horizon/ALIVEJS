import $ from "jquery";

let audioUnlocked = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
let audioUnlockInProgress = false;
let pendingAudioQueue: (() => void)[] = [];

export function setAudioUnlocked(unlocked: boolean) {
    audioUnlocked = unlocked;
    if (unlocked) {
        pendingAudioQueue.forEach(action => action());
        pendingAudioQueue = [];
    }
}

export function isAudioUnlocked() {
    return audioUnlocked;
}

export function queueIfLocked(action: () => void): boolean {
    if (isAudioUnlocked()) {
        return false;
    }
    pendingAudioQueue.push(action);
    return true;
}

$(function () {
    const unlockAudio = () => {
        if (isAudioUnlocked() || audioUnlockInProgress) return;
        audioUnlockInProgress = true;

        const silentAudio = new Audio();
        silentAudio.preload = "auto";
        silentAudio.src = "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==";

        // Keep the element in the DOM until playback settles to avoid interrupted play() on some browsers.
        silentAudio.style.display = "none";
        document.body.appendChild(silentAudio);

        silentAudio
            .play()
            .then(() => {
                setAudioUnlocked(true);
                $("#audiounlock")?.addClass("hidden");
            })
            .catch(err => {
                if (err?.name !== "AbortError") {
                    console.warn("Audio unlock failed:", err);
                }
            })
            .finally(() => {
                audioUnlockInProgress = false;
                silentAudio.pause();
                silentAudio.removeAttribute("src");
                silentAudio.load();
                silentAudio.remove();
            });
    };
    $(document).one("click touchend keydown", unlockAudio);
});
