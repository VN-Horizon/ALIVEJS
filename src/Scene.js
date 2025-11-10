class Scene {
    constructor(name, engine) {
        this.name = name;
        this.engine = engine;
        this.sceneObjects = [];
        this.isFocusable = false;
        this.lastFocusedElement = null; // Store the last focused element
    }

    addObject(obj) {
        if (!this.sceneObjects.includes(obj)) {
            this.sceneObjects.push(obj);
            obj.syncDOM?.();
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
        // Recursively update focusability for all objects in this scene
        this.sceneObjects.forEach(obj => this.updateObjectFocusability(obj));
        
        // Restore focus to the last focused element when re-enabling focus
        if (focusable && this.lastFocusedElement) {
            const $lastFocused = $(this.lastFocusedElement);
            if ($lastFocused.length && $lastFocused.is(':visible')) {
                $lastFocused.focus();
            }
        }
    }

    updateObjectFocusability(obj) {
        if (obj.domElement) {
            const $element = $(obj.domElement);
            
            if (this.isFocusable) {
                // Enable focus if the element was originally focusable
                if ($element.hasClass('focusable')) {
                    $element.attr('tabindex', '0');
                    $element.css('pointer-events', 'auto');
                }
            } else {
                // Disable focus
                if ($element.hasClass('focusable')) {
                    // Store the last focused element before disabling
                    if ($element.is(':focus')) this.lastFocusedElement = obj.domElement;
                    $element.attr('tabindex', '-1');
                    $element.css('pointer-events', 'none');
                    // Remove focus if currently focused
                    if ($element.is(':focus')) {
                        $element.blur();
                    }
                }
            }
        }

        // Recursively update children
        if (obj.children && obj.children.length > 0) {
            obj.children.forEach(child => this.updateObjectFocusability(child));
        }
    }

    destroy() {
        this.sceneObjects.forEach(obj => obj.destroy?.());
        this.sceneObjects = [];
    }

    update(deltaTime) {
        this.sceneObjects.forEach(obj => obj.update?.(deltaTime));
    }

    render() {
        this.sceneObjects.forEach(obj => obj.render?.());
    }
}

// Export as global
window.Scene = Scene;
