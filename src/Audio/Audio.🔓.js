let audioUnlocked = false;

export function setAudioUnlocked(unlocked) {
    audioUnlocked = unlocked;
}

export function isAudioUnlocked() {
    return audioUnlocked;
}

$(function() {
    const unlockAudio = () => {
        if (isAudioUnlocked()) return;
        const silentAudio = new Audio();
        silentAudio.src = 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==';
        silentAudio.play().then(() => {
            setAudioUnlocked(true);
            $('#audiounlock')?.addClass('hidden');
        }).catch(err => {
            console.warn('Audio unlock failed:', err);
        });
    };
    $(document).one('click touchend keydown', unlockAudio);
});
