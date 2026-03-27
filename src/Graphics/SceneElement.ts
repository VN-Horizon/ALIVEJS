import type { IScene } from "@/Scene/Scene";
import type { AnchorType, SceneElementData, Transform } from "@/Scene/SceneData";
import $ from "jquery";

export interface ISceneElement {
    scene: IScene | null;
    sceneData?: SceneElementData;
    domElement?: HTMLElement | JQuery.PlainObject | null;
    children?: ISceneElement[];
    update?(deltaTime: number): void;
    syncDom?(): void;
    destroy?(): void;
    hide?(immediate?: boolean): void;
    show?(immediate?: boolean): void;
    updateFocusability?(): void;
}

export class SceneElement {
    // Core transform grouped
    transform: Transform = {
        x: 0,
        y: 0,
        z: 0,
        width: 1,
        height: 1,
        rotation: 0,
    };

    anchor: AnchorType = "top-left";
    sceneData: SceneElementData = {};
    scene: IScene | null = null; // reference to owning Scene to access baseZOffset
    domElement: HTMLElement | JQuery.PlainObject | null = null;
    visible: boolean = true;
    originallyVisible: boolean = true; // Store original visibility state
    opacity: number = 1;
    blendMode: string = "normal";
    parent: SceneElement | null = null;
    children: SceneElement[] = [];

    constructor(data: SceneElementData, parent: SceneElement | null = null, scene: IScene | null = null) {
        // Core transform grouped
        this.transform = {
            x: data.transform?.x || data.left || 0,
            y: data.transform?.y || data.top || 0,
            z: data.transform?.z || data.zIndex || 0,
            width: data.transform?.width || data.width || 1,
            height: data.transform?.height || data.height || 1,
            rotation: data.transform?.rotation || data.rotation || 0,
        };

        this.anchor = data.anchor || "top-left";
        this.sceneData = data;
        this.scene = scene; // reference to owning Scene to access baseZOffset
        this.domElement = null;
        this.visible = data.visible !== false;
        this.originallyVisible = this.visible; // Store original visibility state
        this.opacity = data.opacity ?? 1;
        this.blendMode = data.blendMode || "normal";
        this.parent = parent;

        this.createDOMElement();
        if (data.path) this.loadImage(data.path);
        if (parent) parent.addChild(this);
        this.update(1);
    }

    // Backward-compatible property accessors
    get x() {
        return this.transform.x;
    }
    set x(v) {
        this.transform.x = v;
    }
    get y() {
        return this.transform.y;
    }
    set y(v) {
        this.transform.y = v;
    }
    get zIndex() {
        return this.transform.z;
    }
    set zIndex(v) {
        this.transform.z = v;
    }
    get width() {
        return this.transform.width;
    }
    set width(v) {
        this.transform.width = v;
    }
    get height() {
        return this.transform.height;
    }
    set height(v) {
        this.transform.height = v;
    }
    get rotation() {
        return this.transform.rotation;
    }
    set rotation(v) {
        this.transform.rotation = v;
    }

    // Build base style object
    buildBaseStyle(extra = {}) {
        const zBase = this.scene?.baseZOffset || 0;
        let x = this.transform.x;
        let y = this.transform.y;
        let translateX = x;
        let translateY = y;
        // Support for anchor positioning
        switch (this.anchor) {
            case "top-right":
                translateX = x - this.width;
                break;
            case "bottom-left":
                translateY = y - this.height;
                break;
            case "bottom-right":
                translateX = x - this.width;
                translateY = y - this.height;
                break;
            default:
                break;
        }
        return {
            width: `${this.width}px`,
            height: `${this.height}px`,
            display: this.visible ? "block" : "none",
            opacity: this.opacity,
            "mix-blend-mode": this.blendMode,
            transform: `translate(${translateX}px, ${translateY}px) rotate(${this.transform.rotation}rad)`,
            "z-index": zBase + this.transform.z,
            ...extra,
        };
    }

    /**
     * Create the DOM element (<div> for containers, <img> for leaf nodes)
     */
    createDOMElement() {
        const hasChildren = this.sceneData.children && this.sceneData.children.length > 0;
        const elementType = hasChildren ? "div" : "img";
        this.domElement = $(`<${elementType}>`)
            .attr("layer-name", this.sceneData.name || "")
            .css(this.buildBaseStyle())[0];
        if (hasChildren) $(this.domElement).css("overflow", "visible");
        else $(this.domElement).attr("alt", this.sceneData.name || "Scene Element");
        this.syncDom();
    }

    async loadImage(path: string) {
        if (this.domElement?.tagName === "DIV") {
            return;
        }
        const fullImagePath = `/assets/scenes/${this.scene?.name}/${path}.webp`;
        $(this.domElement).attr("src", fullImagePath);
        this.syncDom();
    }

    addChild(child: SceneElement) {
        this.children.push(child);
        child.parent = this;
        this.syncDom();
    }

    removeChild(child: SceneElement) {
        const index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
            child.parent = null;
        }
        this.syncDom();
    }

    findChildByName(name: string): SceneElement | null {
        return this.children.find(child => child.sceneData.name === name) || null;
    }

    updateDOMStyle() {
        if (!this.domElement) return;
        $(this.domElement).css(this.buildBaseStyle());
    }

    update(deltaTime: number) {
        this.children.forEach(child => {
            child.update(deltaTime);
        });
    }

    syncDom() {
        if (!this.domElement) return;

        const engine = window.getEngine();
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
    }

    destroy() {
        this.parent?.removeChild(this);
        this.children.forEach(child => child.destroy());
        this.children = [];
        $(this.domElement)?.remove();
        this.domElement = null;
    }

    hide(fromParent = false) {
        if (fromParent) {
            // Store original visibility state when hiding from parent
            this.originallyVisible = this.visible;
        }
        this.visible = false;
        this.updateDOMStyle();
        this.children.forEach(child => child.hide(true));
    }

    show(fromParent = false) {
        if (fromParent) {
            // Restore original visibility state when showing from parent
            this.visible = this.originallyVisible;
        } else {
            this.visible = true;
        }
        this.updateDOMStyle();
        this.children.forEach(child => child.show(true));
    }
}

export function preserveLayerIndex(oldElement: SceneElement, newElement: SceneElement) {
    const parent = oldElement.parent;
    let childIndex = -1;
    if (parent) {
        childIndex = parent.children.indexOf(oldElement);
    }
    oldElement.destroy();

    if (parent && childIndex >= 0) {
        // Remove new element from end
        const newIndex = parent.children.indexOf(newElement);

        // Insert at original position
        if (newIndex > -1) parent.children.splice(newIndex, 1);
        parent.children.splice(childIndex, 0, newElement);

        // Reorder DOM elements to match children array order
        parent.children.forEach(child => {
            if (child.domElement && child.domElement.parentNode === parent.domElement) {
                $(parent.domElement).append(child.domElement as HTMLElement);
            }
        });
    }
}
