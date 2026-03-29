import * as ogvModule from "ogv";

let audioSupportRef: boolean | null = null;

function checkOggSupport(): boolean {
    if (audioSupportRef !== null) return audioSupportRef;
    const audio = new Audio();
    audioSupportRef = audio.canPlayType('audio/ogg') !== "";
    return audioSupportRef;
}

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

export function createAudioPlayer(): HTMLMediaElement {
    const isSupported = checkOggSupport();
    const player = isSupported ? new Audio() : new ogvRuntime.OGVPlayer();

    player.style.display = "none";
    
    if (document.body) {
        document.body.appendChild(player as unknown as Node);
    } else {
        window.addEventListener(
            "DOMContentLoaded",
            () => {
                document.body.appendChild(player as unknown as Node);
            },
            { once: true },
        );
    }

    return player;
}
