import { loadSettings } from "@/Core/Settings";
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
    
    private layerActive: HTMLElement;
    private layerInactive: HTMLElement;
    private _transitionTimeout: number | null = null;
    private _loadingImageSrc: string | null = null;

    constructor(data: BackgroundData, parent: SceneElement | null = null, scene: IScene | null = null) {
        data.isBackground = true;
        super(data, parent, scene);

        this.backgroundId = `bg-${Math.random().toString(36).substring(2, 11)}`;
        this.backgroundSize = data.backgroundSize || "auto";
        this.backgroundPosition = data.backgroundPosition || "center";
        this.backgroundRepeat = data.backgroundRepeat || "no-repeat";
        this.transition = data.transition || null;

        // Infinite scroll properties
        this.scrollSpeed = {
            x: data.scrollSpeedX || 0,
            y: data.scrollSpeedY || 0,
        };

        this.layerActive = document.createElement("div");
        this.layerInactive = document.createElement("div");

        this.recreateDOMAsBackground();
    }

    private setupLayer(layer: HTMLElement) {
        $(layer).css({
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            "background-size": this.backgroundSize,
            "background-repeat": this.backgroundRepeat,
            "background-position": this.backgroundPosition,
            opacity: 0,
        });
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
                    position: "absolute",
                    overflow: "hidden"
                }),
            )[0];

        this.setupLayer(this.layerActive);
        this.setupLayer(this.layerInactive);

        $(this.layerActive).css("opacity", 1);
        $(this.layerInactive).css("opacity", 0);

        this.domElement.appendChild(this.layerInactive);
        this.domElement.appendChild(this.layerActive);

        super.syncDom();
    }

    async loadImage(path: string) {
        if (!this.scene) {
            console.error("Cannot load background image: Scene is null");
            return;
        }
        const fullImagePath = `/assets/scenes/${this.scene.name}/${path}.avif`;
        this.updateBackgroundImage(fullImagePath);
    }

    updateBackgroundImage(backgroundImageUrl: string | null = null) {
        if (!this.domElement) return;

        backgroundImageUrl = backgroundImageUrl || "";
        this.backgroundImageUrl = backgroundImageUrl;

        if (this._loadingImageSrc === backgroundImageUrl) {
            // Already loading this image
            return;
        }
        this._loadingImageSrc = backgroundImageUrl;

        if (!backgroundImageUrl) {
            // Immediately clear
            this._applyTransition(null);
            return;
        }

        // Preload image
        const img = new Image();
        img.onload = () => {
            // If the requested image changed while we were loading, abort
            if (this._loadingImageSrc !== backgroundImageUrl) return;
            this._applyTransition(backgroundImageUrl);
        };
        img.onerror = () => {
            if (this._loadingImageSrc !== backgroundImageUrl) return;
            console.error(`Failed to load background image: ${backgroundImageUrl}`);
            this._applyTransition(null);
        };
        img.src = backgroundImageUrl;
    }

    private _applyTransition(backgroundImageUrl: string | null) {
        this._loadingImageSrc = null;

        if (this._transitionTimeout !== null) {
            clearTimeout(this._transitionTimeout);
            this._transitionTimeout = null;
            // A transition is currently in progress, forcefully end it
            $(this.layerInactive).css({ transition: "none", opacity: 1 });
            $(this.layerActive).css({ transition: "none", opacity: 0 });

            // Swap them immediately
            const temp = this.layerActive;
            this.layerActive = this.layerInactive;
            this.layerInactive = temp;
        }

        // Prepare new image on inactive layer
        $(this.layerInactive).css({
            "background-image": backgroundImageUrl ? `url('${backgroundImageUrl}')` : "none",
            transition: "none",
            opacity: 0,
        });
        
        // Force reflow
        void this.layerInactive.offsetWidth;

        const settings = loadSettings();
        const effectSpeed = settings.screenEffectsSpeed;
        const effectEnabled = settings.screenEffectsEnabled;
        const durationMultiplier = (!effectEnabled || effectSpeed === 10) ? 0 : 2.0 - (effectSpeed * 0.2);

        let duration = 500;
        if (this.transition) {
            const match = this.transition.match(/(\d+\.?\d*)s/);
            if (match) duration = parseFloat(match[1]) * 1000;
        }
        duration *= durationMultiplier;
        
        const transitionCss = this.transition ? this.transition.replace(/(\d+\.?\d*)s/, `${duration / 1000}s`) : `opacity ${duration / 1000}s ease-in-out`;

        $(this.layerActive).css({
            transition: transitionCss,
            opacity: 0,
        });

        $(this.layerInactive).css({
            transition: transitionCss,
            opacity: 1,
        });

        // Swap references
        const temp = this.layerActive;
        this.layerActive = this.layerInactive;
        this.layerInactive = temp;

        this._transitionTimeout = setTimeout(() => {
            this._transitionTimeout = null;
            $(this.layerInactive).css("transition", "none"); // Clean up transition on old layer
        }, duration) as unknown as number;

        this.updateScrollPosition();
    }

    updateScrollPosition() {
        if (!this.domElement || ((this.scrollSpeed?.x || 0) == 0 && (this.scrollSpeed?.y || 0) == 0)) return;
        $(this.layerActive).css("background-position", `${this.scrollOffset?.x || 0}px ${this.scrollOffset?.y || 0}px`);
        $(this.layerInactive).css("background-position", `${this.scrollOffset?.x || 0}px ${this.scrollOffset?.y || 0}px`);
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
