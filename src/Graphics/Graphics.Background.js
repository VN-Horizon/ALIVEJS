import $ from "jquery";
import { SceneElement, preserveLayerIndex } from "./Graphics.SceneElement.js";

export class Background extends SceneElement {
    constructor(data, parent = null, scene = null) {
        data.isBackground = true;

        super(data, parent, scene);

        this.backgroundId = `bg-${Math.random().toString(36).substr(2, 9)}`;
        this.backgroundImageUrl = null;
        this.backgroundSize = data.backgroundSize || "auto";
        this.backgroundPosition = data.backgroundPosition || "center";
        this.backgroundRepeat = data.backgroundRepeat || "no-repeat";
        this.transition = data.transition || null;

        // Infinite scroll properties
        this.scrollSpeed = {
            x: data.scrollSpeedX || 0,
            y: data.scrollSpeedY || 0,
        };
        this.scrollOffset = { x: 0, y: 0 };

        this.recreateDOMAsBackground();
    }

    recreateDOMAsBackground() {
        if (this.domElement) {
            $(this.domElement).remove();
        }

        this.domElement = $("<div>")
            .attr("id", this.backgroundId)
            .attr("layer-name", this.sceneData.name || "Background")
            .css(
                this.buildBaseStyle({
                    "background-size": this.backgroundSize,
                    "background-repeat": this.backgroundRepeat,
                    "background-position": this.backgroundPosition,
                    transition: this.transition || "none",
                }),
            )[0];

        super.syncDom();
    }

    async loadImage(path) {
        const fullImagePath = `/assets/scenes/${this.scene.name}/${path}.webp`;
        this.updateBackgroundImage(fullImagePath);
    }

    updateBackgroundImage(backgroundImageUrl = null) {
        if (!this.domElement) return;
        this.backgroundImageUrl = backgroundImageUrl;
        if (!backgroundImageUrl) this.backgroundImageUrl = "";
        $(this.domElement).css("background-image", `url('${this.backgroundImageUrl}')`);
        this.updateScrollPosition();
    }

    updateScrollPosition() {
        if (!this.domElement || ((this.scrollSpeed?.x || 0) == 0 && (this.scrollSpeed?.y || 0) == 0)) return;
        $(this.domElement).css("background-position", `${this.scrollOffset?.x || 0}px ${this.scrollOffset?.y || 0}px`);
    }

    resetScrollOffset() {
        this.scrollOffset.x = 0;
        this.scrollOffset.y = 0;
        this.updateScrollPosition();
    }

    update(deltaTime) {
        // Handle scroll offset
        if ((this.scrollSpeed?.x || 0) !== 0 || (this.scrollSpeed?.y || 0) !== 0) {
            if (isNaN(this.scrollOffset.x) || isNaN(this.scrollOffset.y)) {
                this.scrollOffset.x = 0;
                this.scrollOffset.y = 0;
            }
            this.scrollOffset.x += this.scrollSpeed.x * deltaTime;
            this.scrollOffset.y += this.scrollSpeed.y * deltaTime;

            this.updateScrollPosition();
        }
    }
}

export function toBackground(element, options = {}) {
    const {
        backgroundSize = "cover",
        backgroundPosition = "center",
        backgroundRepeat = "repeat",
        scrollSpeedX = 0,
        scrollSpeedY = 0,
        transition = null,
    } = options;

    if (!element || !element.sceneData) {
        console.error("Element must be a valid SceneElement to elevate to Background");
        return null;
    }

    const backgroundData = {
        ...element.sceneData,
        backgroundSize,
        backgroundPosition,
        backgroundRepeat,
        scrollSpeedX,
        scrollSpeedY,
        transition,
    };

    const background = new Background(backgroundData, element.parent, element.scene);
    background.loadImage(element.sceneData.path);

    // Preserve the layer index in the parent's children array
    preserveLayerIndex(element, background);

    return background;
}
