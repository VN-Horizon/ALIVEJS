export class Scene {
    constructor(name, engine, baseZOffset = 0) {
        this.name = name;
        this.engine = engine;
        this.baseZOffset = baseZOffset;
        this.sceneObjects = [];
        this.isFocusable = false;
        this.lastFocusedElement = null;
        this.onDestroyCallbacks = [];
        this.onBeforeFocusCallbacks = [];
        this.onBeforeUnfocusCallbacks = [];
        this.onAfterFocusCallbacks = [];
        this.onAfterUnfocusCallbacks = [];
    }

    addObject(obj) {
        if (!this.sceneObjects.includes(obj)) {
            this.sceneObjects.push(obj);
            obj.scene = this;
            obj.update?.(1);
            obj.syncDom?.();
            return obj;
        }
    }

    removeObject(obj) {
        const index = this.sceneObjects.indexOf(obj);
        if (index > -1) {
            this.sceneObjects.splice(index, 1);
            // Remove from DOM
            $(obj.domElement)?.remove();
        }
    }

    getObjectByName(name) {
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

    findInChildren(obj, name) {
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

    getAllObjects() {
        return this.sceneObjects;
    }

    setFocusable(focusable) {
        this.isFocusable = focusable;
        if (focusable) this.onBeforeFocusCallbacks.forEach(cb => cb());
        else this.onBeforeUnfocusCallbacks.forEach(cb => cb());

        this.sceneObjects.forEach(obj => {
            if (typeof FocusableElement !== 'undefined' && typeof FocusableElement.updateFocusabilityRecursive === 'function') {
                FocusableElement.updateFocusabilityRecursive(obj);
            } else if (typeof obj.updateFocusability === 'function') {
                obj.updateFocusability();
            }
        });

        if (!this.lastFocusedElement) return;
        const $last = $(this.lastFocusedElement);
        if ($last.length && $last.is(':visible')) {
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

    update(deltaTime) {
        this.sceneObjects.forEach(obj => obj.update?.(deltaTime));
    }

    hide() {
        this.sceneObjects.forEach(obj => obj.hide?.(true));
    }

    show() {
        this.sceneObjects.forEach(obj => obj.show?.(true));
    }
}
