import { SceneElement } from "@/Graphics/SceneElement";
import type { IScene } from "@/Scene/Scene";
import $ from "jquery";

export function initCutscenePlayer(dialogWindow: IScene | null) {
    if (!dialogWindow) return;

    const videoElement = document.createElement("video");
    videoElement.style.position = "absolute";
    videoElement.style.left = "0px";
    videoElement.style.top = "0px";
    videoElement.style.width = "640px";
    videoElement.style.height = "480px";    
    videoElement.style.pointerEvents = "none";
    videoElement.style.zIndex = "-1"; // Should be below UI. UI is usually positive, Background is -1
    videoElement.style.opacity = "0"; // Hidden by default

    const sceneElement = new SceneElement({
        name: "CutscenePlayer",
        transform: { x: 0, y: 0, width: 640, height: 480 },
        zIndex: 5
    });
    
    sceneElement.domElement = videoElement;
    sceneElement.opacity = 0;
    dialogWindow.addObject(sceneElement);

    const onTransitionToGraphics = (e: any, isFade: boolean = false) => {
        const { stringParams } = (e as CustomEvent).detail;
        if (stringParams.length < 3) return;
        if (window.skipping) return;
        
        const thirdParam = stringParams[2];
        
        if (thirdParam && thirdParam !== "0") {
            videoElement.style.transition = "none";
            videoElement.src = `/assets/scenes/Cutscenes/F_${thirdParam}.webm`;
            videoElement.style.opacity = "1";
            videoElement.play().catch(err => {
                console.error("Failed to play cutscene", err);
            });
            setTimeout(() => {
                videoElement.style.transition = "opacity 0.5s ease";
                videoElement.style.opacity = "0";
            }, 500);
        } else {
            videoElement.pause();
            videoElement.style.opacity = "0";
            videoElement.src = "";
        }
    };

    videoElement.addEventListener("ended", () => {
        videoElement.style.opacity = "0";
    });

    $(document).on("TransitionToGraphics", (e) => onTransitionToGraphics(e, false));
    $(document).on("TransitionToGraphicsFade", (e) => onTransitionToGraphics(e, true));

    dialogWindow.onDestroyCallbacks.push(() => {
        $(document).off("TransitionToGraphics", onTransitionToGraphics);
        $(document).off("TransitionToGraphicsFade", onTransitionToGraphics);
        videoElement.pause();
        videoElement.src = "";
    });
}
