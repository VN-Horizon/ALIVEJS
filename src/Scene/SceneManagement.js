import { Scene } from './Scene.js';
import { SceneElement } from '../Graphics/Graphics.SceneElement.js';
import { AnimatedSceneElement } from '../Graphics/Graphics.AnimatedSceneElement.js';

const currentExclusionList = [];
const loadingScenes = new Set();

// Global counter to ensure newer scenes always stack above older ones
let __sceneZCounter = 0;

export async function loadScene(path, options = {
    override: false, singleInstance: true, exclusionList: []
}) {
    console.log(`Loading scene: ${path}`);
    const { override = false, singleInstance = true, exclusionList = [] } = options;
    const engine = window.getEngine();
    if (singleInstance) {
        if (engine.isMountedScene(path)) {
            console.warn(`Scene ${path} already mounted. Skipping.`);
            return null;
        }
        if (loadingScenes.has(path)) {
            console.warn(`Scene ${path} is currently loading. Skipping.`);
            return null;
        }
    }
    loadingScenes.add(path);
    currentExclusionList.length = 0;
    currentExclusionList.push(...exclusionList);
    if (override) destroyScene();

    try {
        const sceneData = await $.getJSON(`/assets/scenes/${path}/${path.split('/').pop()}.json`);
        const engine = window.getEngine();
        if (!engine) {
            console.error('Engine not initialized');
            return null;
        }
        // Each newly loaded scene gets a increasing base z offset.
        const scene = new Scene(path, engine, __sceneZCounter * 114514); // large gap to avoid overlap
        __sceneZCounter++;
        if (sceneData.children) {
            createSceneObjects(sceneData.children, null, scene);
        }
        engine.pushScene(scene);
        console.log('Scene loaded successfully:', path);
        return scene;
    } catch (error) {
        console.error(`Error loading scene ${path}:`, error);
        return null;
    } finally {
        loadingScenes.delete(path);
    }
}

function createSceneObjects(children, parent, scene) {
    if (!children || !Array.isArray(children)) return;
    children.forEach(childData => {
        if(currentExclusionList.includes(childData.name)) return;
    // Use AnimatedSceneElement for elements marked as animated
    const ElementClass = childData.animated ? AnimatedSceneElement : SceneElement;
    const obj = new ElementClass(childData, parent, scene);
        // Track root objects for cleanup
        if (!parent) {
            // Add to scene
            if (!scene) {
                console.error('Scene is not defined for root object addition');
                return;
            }
            scene.addObject(obj);
        }

        // Recursively create children
        if (childData.children && childData.children.length) {
            createSceneObjects(childData.children, obj, scene);
        }
        
        // Initialize animation frames if this is an AnimatedSceneElement
        if (obj instanceof AnimatedSceneElement) {
            obj.initializeFrames();
        }
    });
}

export function createBlankScene(name = 'Blank') {
    const engine = window.getEngine();
    if (!engine) {
        console.error('Engine not initialized');
        return null;
    }
    const scene = new Scene(name, engine, __sceneZCounter * 114514);
    __sceneZCounter++;
    engine.pushScene(scene);
    return scene;
}

export function destroyScene() {
    const engine = window.getEngine();
    if (engine) {
        // Pop the top scene from the engine
        engine.popScene();
    }
}
