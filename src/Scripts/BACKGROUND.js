import $ from "jquery";
import { Background } from "../Graphics/Graphics.Background.js";
import { createBlankScene } from "../Scene/SceneManagement.js";

export async function loadBackgroundScene() {
    const backgroundScene = createBlankScene("BACKGROUND");

    const backgroundCG = backgroundScene.addObject(
        new Background({
            name: "BackgroundCG",
            transform: { x: 0, y: 0, width: 640, height: 480 },
            zIndex: -1,
            transition: "background-image 0.5s ease-in-out",
        }),
    );

    // Update transition based on skipping state
    const updateTransition = () => {
        const transition = window.skipping ? "none" : "background-image 0.5s ease-in-out";
        $(backgroundCG.domElement).css("transition", transition);
        $(portrait.domElement).css(
            "transition",
            window.skipping ? "none" : "background-image 0.5s ease-in-out, background-size 0s linear",
        );
    };
    setInterval(updateTransition, 50);

    const portrait = backgroundScene.addObject(
        new Background({
            name: "PortraitCG",
            transform: { x: 0, y: 0, width: 640, height: 480 },
            zIndex: -1,
            backgroundPosition: "left bottom",
            transition: "background-image 0.5s ease-in-out, background-size 0s linear",
        }),
    );
    $(portrait.domElement).css({ "background-size": "none" });

    const setBgImgHandler = e => {
        const { stringParams } = e.detail;
        if (stringParams.length < 2) return;
        if (stringParams[0] === "0" || stringParams[1] === "0") {
            backgroundCG.updateBackgroundImage(null);
            return;
        }
        backgroundCG.updateBackgroundImage(`/assets/scenes/BG/${stringParams[0]}/${stringParams[1]}.webp`);
    };
    const transitionToGraphicsHandler = e => {
        const { stringParams } = e.detail;
        if (stringParams.length < 4) return;
        if (stringParams[2] === "0" || stringParams[3] === "0") {
            backgroundCG.updateBackgroundImage(`/assets/scenes/CG/BLACK/BLACK.webp`);
            return;
        }
        backgroundCG.updateBackgroundImage(`/assets/scenes/BG/${stringParams[2]}/${stringParams[3]}.webp`);
    };
    const setCgHandler = e => {
        const { stringParams } = e.detail;
        if (stringParams.length < 1) return;
        portrait.updateBackgroundImage(null);
        backgroundCG.updateBackgroundImage(
            `/assets/scenes/CG/${stringParams[0].toUpperCase()}/${stringParams[0].toUpperCase()}.webp`,
        );
    };

    const setCharaImgHandler = e => {
        const { stringParams } = e.detail;
        if (stringParams.length < 2) return;
        if (stringParams[0] === "0" || stringParams[1] === "0") {
            portrait.updateBackgroundImage(null);
            return;
        }
        portrait.updateBackgroundImage(`/assets/scenes/Portraits/${stringParams[0]}/${stringParams[1]}.webp`);
    };

    // Handler to restore background image from saved state
    const restoreGraphicsHandler = e => {
        const { bg, character } = e.detail;
        backgroundCG.updateBackgroundImage(bg);
        portrait.updateBackgroundImage(character);
    };

    $(document).on("SetBgImg", setBgImgHandler);
    $(document).on("TransitionToGraphics TransitionToGraphicsFade", transitionToGraphicsHandler);
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
