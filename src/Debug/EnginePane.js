import { Pane } from '../../lib/tweakpane-4.0.5.min.js';
import { createPaneContainer } from './DebugPane.js';

let engineInstance = null;

const pane = new Pane({
    title: 'Game Engine',
    container: createPaneContainer(),
});

// Function to initialize the engine pane with a game engine instance
export function initEnginePane(engine) {
    engineInstance = engine;
    
    // Engine State folder
    const stateFolder = pane.addFolder({
        title: 'Engine State',
        expanded: true,
    });
    
    stateFolder.addBinding(engine, 'running', {
        readonly: true,
        label: 'Running',
    });
    
    stateFolder.addBinding(engine, 'deltaTime', {
        readonly: true,
        label: 'Delta Time',
        view: 'graph',
        min: 0,
        max: 0.1,
    });
    
    stateFolder.addBinding(engine, 'fps', {
        label: 'Target FPS',
        min: 1,
        max: 144,
        step: 1,
    }).on('change', (ev) => {
        engine.frameTime = 1000 / ev.value;
    });
    
    // Scene Management folder
    const sceneFolder = pane.addFolder({
        title: 'Scene Management',
        expanded: true,
    });
    
    const sceneInfo = {
        sceneCount: 0,
        topScene: 'None',
        scenePaths: '',
    };
    
    sceneFolder.addBinding(sceneInfo, 'sceneCount', {
        readonly: true,
        label: 'Scene Count',
    });
    
    sceneFolder.addBinding(sceneInfo, 'topScene', {
        readonly: true,
        label: 'Top Scene',
    });
    
    sceneFolder.addBinding(sceneInfo, 'scenePaths', {
        readonly: true,
        multiline: true,
        rows: 3,
        label: 'Scene Stack',
    });
    
    // Update scene info periodically
    setInterval(() => {
        if (engineInstance) {
            sceneInfo.sceneCount = engineInstance.scenes.length;
            sceneInfo.topScene = engineInstance.getTopScene()?.name || 'None';
            sceneInfo.scenePaths = engineInstance.scenePaths.join('\n') || 'Empty';
        }
    }, 200);
    
    // Controls folder
    const controlsFolder = pane.addFolder({
        title: 'Controls',
        expanded: true,
    });
    
    const sceneControl = {
        selectedScene: 'WINDOW',
    };
    
    controlsFolder.addBinding(sceneControl, 'selectedScene', {
        label: 'Scene',
        options: {
            WINDOW: 'WINDOW',
            GALLERY: 'GALLERY',
            GALLERY_YUZUKI: 'GALLERY_YUZUKI',
            GALLERY_YURIKO: 'GALLERY_YURIKO',
            GALLERY_KUON: 'GALLERY_KUON',
            GALLERY_HARUNA: 'GALLERY_HARUNA',
            GALLERY_ETC: 'GALLERY_ETC',
            START: 'START',
            SYSTEM: 'SYSTEM',
            BACKGROUND: 'BACKGROUND',
        },
    });
    
    const pushSceneBtn = controlsFolder.addButton({
        title: 'Push Scene',
    });
    pushSceneBtn.on('click', async () => {
        if (engineInstance && sceneControl.selectedScene) {
            const sceneName = sceneControl.selectedScene;
            
            // Dynamically import and call the appropriate scene loader
            try {
                if (sceneName === 'WINDOW') {
                    const { pushDialogWindow } = await import('../Scripts/WINDOW/WINDOW.js');
                    await pushDialogWindow();
                } else if (sceneName === 'GALLERY') {
                    const { initGallery } = await import('../Scripts/GALLERY.js');
                    await initGallery();
                } else if (sceneName === 'START') {
                    const { loadStartScene } = await import('../Scripts/START.js');
                    await loadStartScene();
                } else if (sceneName === 'SYSTEM') {
                    const { pushPauseScreen } = await import('../Scripts/SYSTEM.js');
                    await pushPauseScreen();
                } else if (sceneName === 'BACKGROUND') {
                    const { loadBackgroundScene } = await import('../Scripts/BACKGROUND.js');
                    await loadBackgroundScene();
                } else if (sceneName.startsWith('GALLERY_')) {
                    const { gotoCharacterGallery } = await import('../Scripts/GALLERY.js');
                    await gotoCharacterGallery(sceneName.replace('GALLERY_', ''));
                }
            } catch (error) {
                console.error(`Failed to push scene ${sceneName}:`, error);
            }
        }
    });
    
    const clearScenesBtn = controlsFolder.addButton({
        title: 'Clear All Scenes',
    });
    clearScenesBtn.on('click', () => {
        if (engineInstance) {
            engineInstance.clearAllScenes();
        }
    });
}
