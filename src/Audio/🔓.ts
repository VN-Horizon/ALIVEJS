import $ from "jquery";

let audioUnlocked = false;
let audioUnlockInProgress = false;

export function setAudioUnlocked(unlocked: boolean) {
    audioUnlocked = unlocked;
}

export function isAudioUnlocked() {
    return audioUnlocked;
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
