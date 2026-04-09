import { addUnlockedCG } from "@/Core/Save/UnlockedCG";
import { setCurrentDate } from "@/Debug/DateDebugger";
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
        if (transition === lastTransition) return;
        lastTransition = transition;
        if (backgroundCG) backgroundCG.transition = transition;
        if (portrait) portrait.transition = transition;
    };
    let lastTransition = "opacity 0.5s ease-in-out";
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
        const [bgFolder, bgFile] = stringParams;
        if (bgFolder === "0" || bgFile === "0") {
            backgroundCG?.updateBackgroundImage(null);
            return;
        }
        backgroundCG?.updateBackgroundImage(`/assets/scenes/BG/${bgFolder}/${bgFile}.avif`);
    };
    const transitionToGraphicsHandler = (e: any) => {
        const { stringParams } = (e as CustomEvent).detail;
        if (stringParams.length < 4) return;
        const [bgFolder, bgFile, portraitFolder, portraitFile] = stringParams;

        if (bgFolder === "0" || bgFile === "0") {
            backgroundCG?.updateBackgroundImage(`/assets/scenes/CG/BLACK/BLACK.avif`);
        } else {
            backgroundCG?.updateBackgroundImage(`/assets/scenes/BG/${bgFolder}/${bgFile}.avif`);
        }

        if (portraitFolder === "0" || portraitFile === "0" || portraitFile === "パネル") {
            portrait?.updateBackgroundImage(null);
        } else {
            portrait?.updateBackgroundImage(`/assets/scenes/Portraits/${portraitFolder}/${portraitFile}.avif`);
        }
    };
    const setCgHandler = (e: any) => {
        portrait?.updateBackgroundImage(null);
        const { stringParams } = (e as CustomEvent).detail;
        const [rawSceneName, calendarVariant] = stringParams;
        if (!rawSceneName) {
            backgroundCG?.updateBackgroundImage(`/assets/scenes/CG/BLACK/BLACK.avif`);
            return;
        }

        const sceneName = rawSceneName.toLowerCase();
        if (sceneName === "calendar" && calendarVariant) {
            backgroundCG?.updateBackgroundImage(`/assets/scenes/Calendar/CALENDAR/${calendarVariant}.avif`);
            setCurrentDate(calendarVariant);
            return;
        }

        const bgName = rawSceneName === "0" ? "BLACK" : rawSceneName.toUpperCase();
        backgroundCG?.updateBackgroundImage(
            `/assets/scenes/CG/${bgName}/${bgName}.avif`,
        );
        if (bgName !== "BLACK") {
            addUnlockedCG(bgName);
        }
    };

    const setCharaImgHandler = (e: any) => {
        const { stringParams } = (e as CustomEvent).detail;
        if (stringParams.length < 2) return;
        const [portraitFolder, portraitFile] = stringParams;
        if (portraitFolder === "0" || portraitFile === "0") {
            portrait?.updateBackgroundImage(null);
            return;
        }
        portrait?.updateBackgroundImage(`/assets/scenes/Portraits/${portraitFolder}/${portraitFile}.avif`);
    };

    const showStaffImageHandler = (e: any) => {
        const { stringParams } = (e as CustomEvent).detail;
        if (stringParams.length < 2) return;
        const [type, id] = stringParams;
        portrait?.updateBackgroundImage(null);
        backgroundCG?.updateBackgroundImage(`/assets/scenes/UI/${type}/${id}.avif`);
    };

    // Handler to restore background image from saved state
    const restoreGraphicsHandler = (e: any) => {
        const { bg, character } = (e as CustomEvent).detail;
        backgroundCG?.updateBackgroundImage(bg);
        portrait?.updateBackgroundImage(character);
    };

    $(document).on("SetBgImg", setBgImgHandler);
    $(document).on("TransitionToGraphics TransitionToGraphicsFade", transitionToGraphicsHandler);
    $(document).on("ShowCg", setCgHandler);
    $(document).on("SetCharaImg", setCharaImgHandler);
    $(document).on("RestoreGraphics", restoreGraphicsHandler);
    $(document).on("FadeSystemToBlack", setCgHandler); // Reuse CG handler for fade to black
    $(document).on("ShowStaffImage", showStaffImageHandler);

    backgroundScene.onDestroyCallbacks.push(() => {
        $(document).off("SetBgImg", setBgImgHandler);
        $(document).off("TransitionToGraphics TransitionToGraphicsFade", transitionToGraphicsHandler);
        $(document).off("ShowCg", setCgHandler);
        $(document).off("SetCharaImg", setCharaImgHandler);
        $(document).off("RestoreGraphics", restoreGraphicsHandler);
        $(document).off("FadeSystemToBlack", setCgHandler);
        $(document).off("ShowStaffImage", showStaffImageHandler);
    });
    return backgroundScene;
}
