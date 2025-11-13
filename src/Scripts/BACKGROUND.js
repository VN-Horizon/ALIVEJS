import { Background } from '../Graphics/Graphics.Background.js';
import { createBlankScene } from '../Scene/SceneManagement.js';

export async function loadBackgroundScene() {
    const backgroundScene = createBlankScene("BACKGROUND");

    const backgroundCG = backgroundScene.addObject(new Background({
        name: "BackgroundCG",
        transform: { x: 0, y: 0, width: 640, height: 480 },
        zIndex: -1,
        transition: 'background-image 0.5s ease-in-out'
    }));
    
    // Update transition based on skipping state
    const updateTransition = () => {
        const transition = window.skipping ? 'none' : 'background-image 0.5s ease-in-out';
        $(backgroundCG.domElement).css('transition', transition);
        $(portrait.domElement).css('transition', window.skipping ? 'none' : 'background-image 0.5s ease-in-out, background-size 0s linear');
    };
    setInterval(updateTransition, 50);

    const portrait = backgroundScene.addObject(new Background({
        name: "PortraitCG",
        transform: { x: 0, y: 0, width: 640, height: 480 },
        zIndex: -1,
        backgroundPosition: 'left bottom',
        transition: 'background-image 0.5s ease-in-out, background-size 0s linear',
    }));
    $(portrait.domElement).css({'background-size': 'none'});

    const setBgImgHandler = (e) => {
        const { stringParams } = e.detail;
        backgroundCG.updateBackgroundImage(stringParams.length >= 2 ? `/assets/scenes/BG/${stringParams[0]}/${stringParams[1]}.webp` : null);
    };

    const setCharaImgHandler = (e) => {
        const { stringParams } = e.detail;
        portrait.updateBackgroundImage(stringParams.length >= 2 ? `/assets/scenes/Portraits/${stringParams[0]}/${stringParams[1]}.webp` : null);
    };

    // Handler to restore background image from saved state
    const restoreBgImgHandler = (e) => {
        const { backgroundImage } = e.detail;
        backgroundCG.updateBackgroundImage(backgroundImage);
    };

    // Handler to restore portrait image from saved state
    const restoreCharaImgHandler = (e) => {
        const { backgroundImage } = e.detail;
        portrait.updateBackgroundImage(backgroundImage);
    };

    document.addEventListener('SetBgImg', setBgImgHandler);
    document.addEventListener('SetCharaImg', setCharaImgHandler);
    document.addEventListener('RestoreBgImg', restoreBgImgHandler);
    document.addEventListener('RestoreCharaImg', restoreCharaImgHandler);

    backgroundScene.onDestroyCallbacks.push(() => {
        document.removeEventListener('SetBgImg', setBgImgHandler);
        document.removeEventListener('SetCharaImg', setCharaImgHandler);
        document.removeEventListener('RestoreBgImg', restoreBgImgHandler);
        document.removeEventListener('RestoreCharaImg', restoreCharaImgHandler);
    });
    return backgroundScene;
}
