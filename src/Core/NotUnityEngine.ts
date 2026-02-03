import type { ISceneElement } from "@/Graphics/Graphics.SceneElement";
import type { IScene } from "@/Scene/Scene";
import $ from "jquery";

export interface GameEngineCallbacks {
    init: (() => void) | null;
    update: ((deltaTime: number) => void) | null;
    updatePost: ((deltaTime: number) => void) | null;
}

export interface IGameEngine {
    start(): void;
    stop(): void;
    getObjectByName(name: string): any;
    getAllObjects(): any[];
    pushScene(scene: any): void;
    popScene(): any;
    getTopScene(): any;
    getSceneByName(name: string): any;
    clearAllScenes(): void;
    isMountedScene(name: string): boolean;
    getContainer(): HTMLElement;
    containerId: string;
    container: HTMLElement;
    running: boolean;
    deltaTime: number;
    lastFrameTime: number;
    fps: number;
    frameTime: number;
    callbacks: GameEngineCallbacks;
    scenes: any[];
    scenePaths: string[];
}

export class GameEngine implements IGameEngine {
    containerId: string = "gameContainer";
    container = $(`#${this.containerId}`)[0] || this.createContainer();
    running: boolean = false;
    deltaTime: number = 0;
    lastFrameTime: number = 0;
    fps: number = 24;
    frameTime: number = 1000 / this.fps;
    callbacks: GameEngineCallbacks = {
        init: null,
        update: null,
        updatePost: null,
    };
    scenes: any[] = []; // Array to hold all scenes
    scenePaths: string[] = []; // Array to hold scene paths

    createContainer() {
        const $container = $('<div id="gameContainer"></div>');
        $("body").append($container);
        return $container[0];
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

    updateScenes(deltaTime: number) {
        this.scenes.forEach(scene => scene.update(deltaTime));
    }

    getObjectByName(name: string) {
        for (const scene of this.scenes) {
            const obj = scene.getObjectByName(name);
            if (obj) return obj;
        }
        return null;
    }

    getAllObjects() {
        // Collect all objects from all scenes
        const allObjects: ISceneElement[] = [];
        this.scenes.forEach(scene => {
            allObjects.push(...scene.getAllObjects());
        });
        return allObjects;
    }

    // Scene management methods
    pushScene(scene: IScene) {
        // Disable focusability on all existing scenes
        this.scenes.forEach(s => s.setFocusable(false));

        // Add new scene
        this.scenes.push(scene);
        this.scenePaths.push(scene.name);

        // Enable focusability only on the new scene
        scene.setFocusable(true);
    }

    popScene(): IScene | null {
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

    getSceneByName(name: string): IScene | null {
        return this.scenes.find(s => s.name === name) || null;
    }

    clearAllScenes() {
        while (this.scenes.length > 0) this.popScene();
    }

    isMountedScene(name: string): boolean {
        return this.scenePaths.includes(name);
    }

    getContainer() {
        return this.container;
    }
}
