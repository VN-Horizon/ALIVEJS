import $ from 'jquery';

export class GameEngine {
    constructor(containerId = 'gameContainer') {
        this.container = $(`#${containerId}`)[0] || this.createContainer();
        this.running = false;
        this.deltaTime = 0;
        this.lastFrameTime = 0;
        this.fps = 24;
        this.frameTime = 1000 / this.fps;

        this.callbacks = {
            init: null,
            update: null,
            updatePost: null,
        };

        this.scenes = []; // Array to hold all scenes
        this.scenePaths = []; // Array to hold scene paths
    }

    createContainer() {
        const $container = $('<div id="gameContainer"></div>');
        $('body').append($container);
        return $container[0];
    }

    registerCallbacks(init, update, updatePost) {
        this.callbacks.init = init;
        this.callbacks.update = update;
        this.callbacks.updatePost = updatePost;
    }

    start() {
        if (this.running) return;
        
        this.running = true;
        this.lastFrameTime = performance.now();

        // Call init callback
        if (this.callbacks.init) {
            this.callbacks.init();
        }

        this.gameLoop();
    }

    stop() {
        this.running = false;
    }

    gameLoop = () => {
        if (!this.running) return;

        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        if (this.deltaTime > 0.1) {
            this.deltaTime = 0.1;
        }

        if (this.callbacks.update) {
            this.callbacks.update(this.deltaTime);
        }

        this.updateScenes(this.deltaTime);

        if (this.callbacks.updatePost) {
            this.callbacks.updatePost(this.deltaTime);
        }

        requestAnimationFrame(this.gameLoop);
    };

    updateScenes(deltaTime) {
        this.scenes.forEach(scene => scene.update(deltaTime));
    }

    getObjectByName(name) {
        for (const scene of this.scenes) {
            const obj = scene.getObjectByName(name);
            if (obj) return obj;
        }
        return null;
    }

    getAllObjects() {
        // Collect all objects from all scenes
        const allObjects = [];
        this.scenes.forEach(scene => {
            allObjects.push(...scene.getAllObjects());
        });
        return allObjects;
    }

    // Scene management methods
    pushScene(scene) {
        // Disable focusability on all existing scenes
        this.scenes.forEach(s => s.setFocusable(false));
        
        // Add new scene
        this.scenes.push(scene);
        this.scenePaths.push(scene.name);
        
        // Enable focusability only on the new scene
        scene.setFocusable(true);
    }

    popScene() {
        if (this.scenes.length === 0) return null;
        
        // Remove and destroy the top scene
        const scene = this.scenes.pop();
        scene.destroy();
        this.scenePaths.pop();
        
        // Enable focus on the new top scene
        if (this.scenes.length > 0) {
            this.scenes[this.scenes.length - 1].setFocusable(true);
        }
        
        return scene;
    }

    getTopScene() {
        return this.scenes.length > 0 ? this.scenes[this.scenes.length - 1] : null;
    }

    getSceneByName(name) {
        return this.scenes.find(s => s.name === name) || null;
    }

    clearAllScenes() {
        while (this.scenes.length > 0) this.popScene();
    }

    isMountedScene(name) {
        return this.scenePaths.includes(name);
    }

    getContainer() {
        return this.container;
    }
}
