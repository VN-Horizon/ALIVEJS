class SceneElement {
    constructor(data, parent = null, scenePath = '') {
        // Core transform grouped
        this.transform = {
            x: data.left || 0,
            y: data.top || 0,
            z: data.zIndex || 0,
            width: data.width || 1,
            height: data.height || 1,
            rotation: data.rotation || 0
        };

        this.sceneData = data;
        this.scenePath = scenePath;
        this.domElement = null;
        this.visible = data.visible !== false;
        this.opacity = data.opacity ?? 1;
        this.blendMode = data.blendMode || 'normal';
        this.parent = parent;
        this.children = [];

        this.createDOMElement();
        if (data.path) this.loadImage(data.path);
        if (parent) parent.addChild(this);
        this.syncDOM();
    }

    // Backward-compatible property accessors
    get x() { return this.transform.x; } set x(v) { this.transform.x = v; }
    get y() { return this.transform.y; } set y(v) { this.transform.y = v; }
    get zIndex() { return this.transform.z; } set zIndex(v) { this.transform.z = v; }
    get width() { return this.transform.width; } set width(v) { this.transform.width = v; }
    get height() { return this.transform.height; } set height(v) { this.transform.height = v; }
    get rotation() { return this.transform.rotation; } set rotation(v) { this.transform.rotation = v; }

    // Build base style object
    buildBaseStyle(extra = {}) {
        return {
            width: `${this.width}px`,
            height: `${this.height}px`,
            display: this.visible ? 'block' : 'none',
            opacity: this.opacity,
            'mix-blend-mode': this.blendMode,
            transform: `translate(${this.x}px, ${this.y}px) rotate(${this.rotation}rad)` ,
            'z-index': this.zIndex,
            ...extra
        };
    }

    /**
     * Create the DOM element (<div> for containers, <img> for leaf nodes)
     */
    createDOMElement() {
        const hasChildren = this.sceneData.children && this.sceneData.children.length > 0;
        const elementType = hasChildren ? 'div' : 'img';
        this.domElement = $(`<${elementType}>`)
            .attr('layer-name', this.sceneData.name || '')
            .css(this.buildBaseStyle())[0];
        if (hasChildren) $(this.domElement).css('overflow', 'visible');
        else $(this.domElement).attr('alt', this.sceneData.name || 'Scene Element');
    }

    async loadImage(path) {
        if (this.domElement.tagName === 'DIV') {
            return;
        }
        const fullImagePath = `/assets/scenes/${this.scenePath}/${path}.webp`;
        $(this.domElement).attr('src', fullImagePath);
    }

    addChild(child) {
        this.children.push(child);
        child.parent = this;
    }

    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
            child.parent = null;
        }
    }

    findChildByName(name) {
        return this.children.find(child => child.sceneData.name === name) || null;
    }

    updateDOMStyle() {
        if (!this.domElement) return;
        $(this.domElement).css(this.buildBaseStyle());
    }

    syncDOM() {
        if (!this.domElement) return;
        
        const engine = getEngine();
        const $element = $(this.domElement);
        
        if (this.parent) {
            if (this.domElement.parentNode !== this.parent.domElement) {
                $(this.parent.domElement).append($element);
            }
        } else if (engine) {
            if (this.domElement.parentNode !== engine.container) {
                $(engine.container).append($element);
            }
        }

        this.updateDOMStyle();

        this.children.forEach(child => {
            child.syncDOM();
        });
    }

    update(deltaTime) {
        this.children.forEach(child => {
            child.update(deltaTime);
        });
    }

    destroy() {
        this.parent?.removeChild(this);
        this.children.forEach(child => child.destroy());
        this.children = [];
        $(this.domElement)?.remove();
        this.domElement = null;
    }
}

// Export as global
window.SceneElement = SceneElement;

