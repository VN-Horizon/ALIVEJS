const currentExclusionList = [];
const loadingScenes = new Set();

async function loadScene(path, options = {
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
        const scene = new Scene(path, engine);
        if (sceneData.children) {
            createSceneObjects(sceneData.children, null, path, scene);
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

function createSceneObjects(children, parent, scenePath, scene) {
    if (!children || !Array.isArray(children)) return;
    children.forEach(childData => {
        const obj = new SceneElement(childData, parent, scenePath);
        // Track root objects for cleanup
        if (!parent) {
            // Add to scene
            if (!scene) {
                console.error('Scene is not defined for root object addition');
                return;
            }
            if(currentExclusionList.includes(childData.name)) return;
            scene.addObject(obj);
        }

        // Recursively create children
        if (childData.children && childData.children.length) {
            createSceneObjects(childData.children, obj, scenePath, scene);
        }
    });
}

function destroyScene() {
    const engine = window.getEngine();
    if (engine) {
        // Pop the top scene from the engine
        engine.popScene();
    }
}

// Export as globals
window.loadScene = loadScene;
window.destroyScene = destroyScene;
