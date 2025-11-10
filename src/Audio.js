const bgmList = {};
let currentBGM = null;
let audioUnlocked = false;

/**
 * Initialize BGM tracks
 */
function initBGM() {
    for (let i = 0; i < 22; i++) {
        const audioElement = new Audio(`/assets/audio/bgm/M${i.toString().padStart(2, '0')}.mp3`);
        audioElement.loop = true;
        audioElement.volume = 0.5;
        const trackName = `M${i.toString().padStart(2, '0')}`;
        bgmList[trackName] = audioElement;
    }
    console.log('BGM initialized');
}

/**
 * Play a BGM track
 * @param {string} name - Track name (e.g., "M07")
 */
function playBGM(name) {
    if (!audioUnlocked) {
        console.error('Audio locked');
        return;
    }
    if (currentBGM) {
        currentBGM.pause();
        currentBGM.currentTime = 0;
    }
    currentBGM = bgmList[name];
    if (currentBGM) {
        currentBGM.play().catch(err => {
            console.warn('Play BGM failed:', err);
        });
    }
}

/**
 * Stop current BGM
 */
function stopBGM() {
    if (currentBGM) {
        currentBGM.pause();
        currentBGM.currentTime = 0;
        currentBGM = null;
    }
}

function setAudioUnlocked(unlocked) {
    audioUnlocked = unlocked;
}

function isAudioUnlocked() {
    return audioUnlocked;
}


// Initialize audio unlock mechanism
$(function() {
    const unlockAudio = () => {
        const $overlay = $('#audiounlock');
        if(!$overlay.length) return;
        if (isAudioUnlocked()) return;
        const silentAudio = new Audio();
        silentAudio.src = 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==';
        silentAudio.play().then(() => {
            setAudioUnlocked(true);
            $overlay.addClass('hidden');
        }).catch(err => {
            console.warn('Audio unlock failed:', err);
        });
    };
    $(document).one('click touchend keydown', unlockAudio);
});

window.initBGM = initBGM;
window.playBGM = playBGM;
window.stopBGM = stopBGM;
window.setAudioUnlocked = setAudioUnlocked;
window.isAudioUnlocked = isAudioUnlocked;
