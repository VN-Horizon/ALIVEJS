class Scene {
    constructor(name, engine) {
        this.name = name;
        this.engine = engine;
        this.sceneObjects = [];
        this.isFocusable = false;
        this.lastFocusedElement = null; // Store the last focused element
        this.onDestroyCallbacks = [];
        this.onBeforeFocusCallbacks = [];
        this.onBeforeUnfocusCallbacks = [];
        this.onAfterFocusCallbacks = [];
        this.onAfterUnfocusCallbacks = [];
    }

    addObject(obj) {
        if (!this.sceneObjects.includes(obj)) {
            this.sceneObjects.push(obj);
            obj.update?.(1);
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
        if(focusable) this.onBeforeFocusCallbacks.forEach(callback => callback());
        else this.onBeforeUnfocusCallbacks.forEach(callback => callback());
        // Recursively update focusability for all objects in this scene
        this.sceneObjects.forEach(obj => this.updateObjectFocusability(obj));
        
        // Restore focus to the last focused element when re-enabling focus
        if (focusable && this.lastFocusedElement) {
            const $lastFocused = $(this.lastFocusedElement);
            if ($lastFocused.length && $lastFocused.is(':visible')) {
                $lastFocused.focus();
            }
        }
        if(focusable) this.onAfterFocusCallbacks.forEach(callback => callback());
        else this.onAfterUnfocusCallbacks.forEach(callback => callback());
    }

    updateObjectFocusability(obj) {
        if (obj.domElement) {
            const $element = $(obj.domElement);
            
            if (this.isFocusable && $element.hasClass('non-focusable')) {
                // Enable focus if the element was originally focusable
                $element.css('pointer-events', 'auto');
                $element.removeClass('non-focusable');
                $element.addClass('focusable');
            } else {
                // Disable focus
                if ($element.hasClass('focusable')) {
                    // Store the last focused element before disabling
                    if ($element.is(':focus')) this.lastFocusedElement = obj.domElement;
                    $element.css('pointer-events', 'none');
                    // Remove focus if currently focused
                    if ($element.is(':focus')) {
                        $element.blur();
                    }
                    $element.removeClass('focusable');
                    $element.addClass('non-focusable');
                }
            }
        }

        // Recursively update children
        if (obj.children && obj.children.length > 0) {
            obj.children.forEach(child => this.updateObjectFocusability(child));
        }
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
        this.sceneObjects.forEach(obj => obj.hide?.());
    }

    show() {
        this.sceneObjects.forEach(obj => obj.show?.());
    }
}

// Export as global
window.Scene = Scene;
