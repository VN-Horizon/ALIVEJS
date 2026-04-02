import { Background } from "@/Graphics/Background";
import { createBlankScene } from "@/Scene/SceneManagement";
import $ from "jquery";

export async function loadBackgroundScene() {
    const backgroundScene = createBlankScene("BACKGROUND");
    if (!backgroundScene) {
        console.error("Failed to create BACKGROUND scene");
        return null;
    }

    const backgroundCG = backgroundScene.addObject(
        new Background({
            name: "BackgroundCG",
            transform: { x: 0, y: 0, width: 640, height: 480 },
            zIndex: -1,
            transition: "opacity 0.5s ease-in-out",
        }),
    );

    // Update transition based on skipping state
    const updateTransition = () => {
        const transition = window.skipping ? "none" : "opacity 0.5s ease-in-out";
        if (backgroundCG) backgroundCG.transition = transition;
        if (portrait) portrait.transition = transition;
    };
    setInterval(updateTransition, 50);

    const portrait = backgroundScene.addObject(
        new Background({
            name: "PortraitCG",
            transform: { x: 0, y: 0, width: 640, height: 480 },
            zIndex: -1,
            backgroundPosition: "left bottom",
            transition: "opacity 0.5s ease-in-out",
        }),
    );

    const setBgImgHandler = (e: any) => {
        const { stringParams } = (e as CustomEvent).detail;
        if (stringParams.length < 2) return;
        if (stringParams[0] === "0" || stringParams[1] === "0") {
            backgroundCG?.updateBackgroundImage(null);
            return;
        }
        backgroundCG?.updateBackgroundImage(`/assets/scenes/BG/${stringParams[0]}/${stringParams[1]}.avif`);
    };
    const transitionToGraphicsHandler = (e: any, paramOffset: number = 0) => {
        const { stringParams } = (e as CustomEvent).detail;
        if (stringParams.length < 4) return;
        if (stringParams[paramOffset] === "0" || stringParams[paramOffset + 1] === "0") {
            backgroundCG?.updateBackgroundImage(`/assets/scenes/CG/BLACK/BLACK.avif`);
            return;
        }
        backgroundCG?.updateBackgroundImage(`/assets/scenes/BG/${stringParams[paramOffset]}/${stringParams[paramOffset+1]}.avif`);
    };
    const setCgHandler = (e: any) => {
        const { stringParams } = (e as CustomEvent).detail;
        if (stringParams.length < 1) return;
        const bgName = stringParams[0] === "0"? "BLACK" : stringParams[0].toUpperCase();
        portrait?.updateBackgroundImage(null);
        backgroundCG?.updateBackgroundImage(
            `/assets/scenes/CG/${bgName}/${bgName}.avif`,
        );
    };

    const setCharaImgHandler = (e: any) => {
        const { stringParams } = (e as CustomEvent).detail;
        if (stringParams.length < 2) return;
        if (stringParams[0] === "0" || stringParams[1] === "0") {
            portrait?.updateBackgroundImage(null);
            return;
        }
        portrait?.updateBackgroundImage(`/assets/scenes/Portraits/${stringParams[0]}/${stringParams[1]}.avif`);
    };

    // Handler to restore background image from saved state
    const restoreGraphicsHandler = (e: any) => {
        const { bg, character } = (e as CustomEvent).detail;
        console.log("restore graphics handler fired with:", bg, character);
        backgroundCG?.updateBackgroundImage(bg);
        portrait?.updateBackgroundImage(character);
    };

    $(document).on("SetBgImg", setBgImgHandler);
    $(document).on("TransitionToGraphicsFade", e => transitionToGraphicsHandler(e, 0));
    $(document).on("TransitionToGraphics", e => transitionToGraphicsHandler(e, 2));
    $(document).on("ShowCg", setCgHandler);
    $(document).on("SetCharaImg", setCharaImgHandler);
    $(document).on("RestoreGraphics", restoreGraphicsHandler);

    backgroundScene.onDestroyCallbacks.push(() => {
        $(document).off("SetBgImg", setBgImgHandler);
        $(document).off("TransitionToGraphics TransitionToGraphicsFade", transitionToGraphicsHandler);
        $(document).off("ShowCg", setCgHandler);
        $(document).off("SetCharaImg", setCharaImgHandler);
        $(document).off("RestoreGraphics", restoreGraphicsHandler);
    });
    return backgroundScene;
}
