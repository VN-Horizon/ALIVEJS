audioUnlocked = false;

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

window.setAudioUnlocked = setAudioUnlocked;
window.isAudioUnlocked = isAudioUnlocked;
