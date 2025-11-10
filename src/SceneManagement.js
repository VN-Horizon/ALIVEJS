// Scene state
let currentScene = [];

async function loadScene(path, override = true) {
    console.log(`Loading scene: ${path}`);
    
    if(override) destroyScene();

    try {
        const sceneData = await $.getJSON(`/assets/scenes/${path}/${path.split('/').pop()}.json`);
        console.log('Loaded Scene data:', sceneData);
        
        // Create a new Scene object
        const engine = getEngine();
        if (!engine) {
            console.error('Engine not initialized');
            return null;
        }
        
        const sceneName = path.split('/').pop();
        const scene = new Scene(sceneName, engine);
        
        if (sceneData.children) {
            createSceneObjects(sceneData.children, null, path, scene);
        }
        
        // Push the scene to the engine
        engine.pushScene(scene);
        
        console.log('Scene loaded successfully');
        return scene;
    } catch (error) {
        console.error(`Error loading scene: ${error}`);
        return null;
    }
}

function createSceneObjects(children, parent, scenePath, scene) {
    if (!children || !Array.isArray(children)) return;

    children.forEach(childData => {
        const obj = new SceneElement(childData, parent, scenePath);
        // Track root objects for cleanup
        if (!parent) {
            currentScene.push(obj);
            // Add to scene
            if (scene) {
                scene.addObject(obj);
            }
        }

        // Recursively create children
        if (childData.children && childData.children.length) {
            createSceneObjects(childData.children, obj, scenePath, scene);
        }
    });
}

function destroyScene() {
    const engine = getEngine();
    if (engine) {
        // Pop the top scene from the engine
        engine.popScene();
    }
    
    // Clear the legacy currentScene array
    if (currentScene && currentScene.length) {
        currentScene.forEach(obj => {
            if (obj.destroy) obj.destroy();
        });
        currentScene = [];
    }
}

// Export as globals
window.loadScene = loadScene;
window.destroyScene = destroyScene;
