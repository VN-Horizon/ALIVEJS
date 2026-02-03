import type { GameEngine } from "@/Core/NotUnityEngine";
import { FocusableElement } from "@/Graphics/FocusableElement.js";
import type { ISceneElement } from "@/Graphics/SceneElement";
import $ from "jquery";

export interface IScene {
    name: string;
    engine: any;
    baseZOffset: number;
    sceneObjects: ISceneElement[];
    isFocusable: boolean;
    lastFocusedElement: HTMLElement | JQuery.PlainObject | null;
    onDestroyCallbacks: Array<() => void>;
    onBeforeFocusCallbacks: Array<() => void>;
    onBeforeUnfocusCallbacks: Array<() => void>;
    onAfterFocusCallbacks: Array<() => void>;
    addObject(obj: ISceneElement): ISceneElement | undefined;
    removeObject(obj: ISceneElement): void;
    getObjectByName(name: string): ISceneElement | null;
    getAllObjects(): ISceneElement[];
    setFocusable(focusable: boolean): void;
    destroy(): void;
    update(deltaTime: number): void;
    hide(): void;
    show(): void;
}

export class Scene {
    name: string;
    engine: GameEngine;
    baseZOffset: number = 0;
    sceneObjects: ISceneElement[] = [];
    isFocusable = false;
    lastFocusedElement: HTMLElement | JQuery.PlainObject | null = null;
    onDestroyCallbacks: Array<() => void> = [];
    onBeforeFocusCallbacks: Array<() => void> = [];
    onBeforeUnfocusCallbacks: Array<() => void> = [];
    onAfterFocusCallbacks: Array<() => void> = [];
    onAfterUnfocusCallbacks: Array<() => void> = [];

    constructor(name: string, engine: GameEngine, baseZOffset: number = 0) {
        this.name = name;
        this.engine = engine;
        this.baseZOffset = baseZOffset;
    }

    addObject(obj: ISceneElement) {
        if (!this.sceneObjects.includes(obj)) {
            this.sceneObjects.push(obj);
            obj.scene = this;
            obj.update?.(1);
            obj.syncDom?.();
            return obj;
        }
    }

    removeObject(obj: ISceneElement) {
        const index = this.sceneObjects.indexOf(obj);
        if (index > -1) {
            this.sceneObjects.splice(index, 1);
            // Remove from DOM
            $(obj.domElement)?.remove();
        }
    }

    getObjectByName(name: string) {
        // Search recursively through objects and their children
        for (const obj of this.sceneObjects) {
            if (obj.sceneData && obj.sceneData.name === name) {
                return obj;
            }
            // Search in children recursively
            const found = this.findInChildren(obj, name);
            if (found) return found;
        }
        return null;
    }

    findInChildren(obj: ISceneElement, name: string): ISceneElement | null {
        if (!obj.children || obj.children.length === 0) return null;

        for (const child of obj.children) {
            if (child.sceneData && child.sceneData.name === name) {
                return child;
            }
            const found = this.findInChildren(child, name);
            if (found) return found;
        }
        return null;
    }

    getAllObjects(): ISceneElement[] {
        return this.sceneObjects;
    }

    setFocusable(focusable: boolean) {
        this.isFocusable = focusable;
        if (focusable) this.onBeforeFocusCallbacks.forEach(cb => cb());
        else this.onBeforeUnfocusCallbacks.forEach(cb => cb());

        this.sceneObjects.forEach(obj => {
            if (
                typeof FocusableElement !== "undefined" &&
                typeof FocusableElement.updateFocusabilityRecursive === "function"
            ) {
                FocusableElement.updateFocusabilityRecursive(obj as FocusableElement);
            } else if (typeof obj.updateFocusability === "function") {
                obj.updateFocusability();
            }
        });

        if (!this.lastFocusedElement) return;
        const $last = $(this.lastFocusedElement);
        if ($last.length && $last.is(":visible")) {
            $last.focus();
        }

        if (focusable) this.onAfterFocusCallbacks.forEach(cb => cb());
        else this.onAfterUnfocusCallbacks.forEach(cb => cb());
    }

    destroy() {
        this.onDestroyCallbacks.forEach(callback => callback());
        this.sceneObjects.forEach(obj => obj.destroy?.());
        this.sceneObjects = [];
    }

    update(deltaTime: number) {
        this.sceneObjects.forEach(obj => obj.update?.(deltaTime));
    }

    hide() {
        this.sceneObjects.forEach(obj => obj.hide?.(true));
    }

    show() {
        this.sceneObjects.forEach(obj => obj.show?.(true));
    }
}
