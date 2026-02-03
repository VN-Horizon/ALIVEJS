import type { IScene } from "@/Scene/Scene";
import type { SceneElementData } from "@/Scene/SceneData";
import $ from "jquery";
import { SceneElement, preserveLayerIndex } from "./SceneElement";

export interface BackgroundData extends SceneElementData {
    isBackground?: boolean;
    backgroundSize?: string;
    backgroundPosition?: string;
    backgroundRepeat?: string;
    transition?: string | null;
    scrollSpeedX?: number;
    scrollSpeedY?: number;
}

export class Background extends SceneElement {
    backgroundId: string;
    backgroundImageUrl: string | null = null;
    backgroundSize: string;
    backgroundPosition: string;
    backgroundRepeat: string;
    transition: string | null;
    scrollSpeed: { x: number; y: number };
    scrollOffset: { x: number; y: number } = { x: 0, y: 0 };

    constructor(data: BackgroundData, parent: SceneElement | null = null, scene: IScene | null = null) {
        data.isBackground = true;
        super(data, parent, scene);

        this.backgroundId = `bg-${Math.random().toString(36).substr(2, 9)}`;
        this.backgroundSize = data.backgroundSize || "auto";
        this.backgroundPosition = data.backgroundPosition || "center";
        this.backgroundRepeat = data.backgroundRepeat || "no-repeat";
        this.transition = data.transition || null;

        // Infinite scroll properties
        this.scrollSpeed = {
            x: data.scrollSpeedX || 0,
            y: data.scrollSpeedY || 0,
        };

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

    async loadImage(path: string) {
        if (!this.scene) {
            console.error("Cannot load background image: Scene is null");
            return;
        }
        const fullImagePath = `/assets/scenes/${this.scene.name}/${path}.webp`;
        this.updateBackgroundImage(fullImagePath);
    }

    updateBackgroundImage(backgroundImageUrl: string | null = null) {
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

    update(deltaTime: number) {
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

export function toBackground(element: SceneElement | null, options: Partial<BackgroundData> = {}) {
    if (!element) {
        console.error("toBackground called with null element");
        return null;
    }
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
    if (element.sceneData?.path) background.loadImage(element.sceneData.path);

    // Preserve the layer index in the parent's children array
    preserveLayerIndex(element, background);

    return background;
}
