import { CutscenePlayer } from "@/Graphics/CutscenePlayer";
import type { IScene } from "@/Scene/Scene";
import $ from "jquery";

export function initCutscenePlayer(dialogWindow: IScene | null) {
  if (!dialogWindow) return;

  const sceneElement = new CutscenePlayer({
    name: "CutscenePlayer",
    transform: { x: 0, y: 0, width: 640, height: 480 },
    zIndex: 5,
  });

  // We can rely on sceneElement.videoElement being initialized.
  const videoElement = sceneElement.videoElement!;
  sceneElement.opacity = 0;
  dialogWindow.addObject(sceneElement);

  const onTransitionToGraphics = (e: any) => {
    const { stringParams } = (e as CustomEvent).detail;
    if (stringParams.length < 3) return;
    if (window.skipping) return;

    const thirdParam: string = stringParams[2];

    if (thirdParam && thirdParam !== "0") {
      videoElement.style.transition = "none";
      videoElement.src = `/assets/scenes/Cutscenes/F_${thirdParam.replace("・", "")}.webm`;
      videoElement.style.opacity = "1";
      videoElement.play().catch((err) => {
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

  $(document).on("TransitionToGraphics", onTransitionToGraphics);

  dialogWindow.onDestroyCallbacks.push(() => {
    $(document).off("TransitionToGraphics", onTransitionToGraphics);
    $(document).off("TransitionToGraphicsFade", onTransitionToGraphics);
    videoElement.pause();
    videoElement.src = "";
  });
}
