import type { IScene } from "@/Scene/Scene";
import type { SceneElementData } from "@/Scene/SceneData";
import $ from "jquery";
import { FocusableElement } from "./FocusableElement";
import { preserveLayerIndex, type SceneElement } from "./SceneElement";

export interface ButtonData extends SceneElementData {
    isButton?: boolean;
    transforms: Array<[number, number, number, number]>;
    stateIndexes?: number[];
    images: string[];
    z?: number;
    cursor?: string;
    flags?: string[];
    callback?: () => void;
    disabled: boolean;
}

export class Button extends FocusableElement {
    private static readonly STATE_COUNT = 4;
    private static readonly SHARED_STYLE_ID = "button-shared-styles";
    transforms: Array<[number, number, number, number]>;
    images: string[];
    onClickHandler: (() => void) | null;
    buttonId: string;
    cursor: string;
    isButton: boolean = true;
    flags: string[];
    disabled: boolean;

    constructor(data: ButtonData, parent: SceneElement | null = null, scene: IScene | null = null) {
        data.isButton = true;

        super(data, parent, scene);

        this.transforms = data.transforms || [];
        const baseTransform = this.transforms[0] || [0, 0, 10, 10];
        this.x = baseTransform[0] || 0;
        this.y = baseTransform[1] || 0;
        this.width = baseTransform[2] || 10;
        this.height = baseTransform[3] || 10;
        this.disabled = data.disabled || false;

        this.images = data.images;
        this.flags = data.flags || [];

        // Preload variant images to ensure they are cached before hover/active states
        this.images.forEach(src => {
            if (src) {
                const img = new Image();
                img.src = src;
            }
        });

        this.onClickHandler = null;
        this.buttonId = `btn-${Math.random().toString(36).substr(2, 9)}`;
        this.transform.z = data.z || 0;
        this.cursor = data.cursor || "pointer";

        Button.ensureSharedStyles();
        this.recreateDOMAsButton();
        if (data.callback) this.onClick(data.callback);
    }

    private static ensureSharedStyles() {
        let $styleSheet = $(`#${Button.SHARED_STYLE_ID}`);
        if ($styleSheet.length) return;
    }

    injectCSSRules() {
        Button.ensureSharedStyles();
    }

    recreateDOMAsButton() {
        let classNames: string[] = [];
        if (this.domElement) {
            classNames = $(this.domElement)?.attr("class")?.split(" ") || [];
            $(this.domElement).remove();
        }

        this.domElement = $("<button>")
            .attr("id", this.buttonId)
            .attr("layer-name", this.sceneData.name || "Button")
            .attr("disabled", this.disabled ? "disabled" : null)
            .attr("class", ["vn-button", ...this.flags, ...classNames].join(" "))
            .css({
                opacity: this.opacity,
                "mix-blend-mode": this.blendMode,
                cursor: this.cursor,
                display: this.visible ? "block" : "none",
            })[0];

        const $button = $(this.domElement);

        const baseTransform = this.transforms[0] || [0, 0, 10, 10];
        for (let i = 0; i < Button.STATE_COUNT; i++) {
            const current = this.transforms[i] || baseTransform;
            const imageSrc = this.images[i] || "";
            const layerX = (current[0] || 0) - (baseTransform[0] || 0);
            const layerY = (current[1] || 0) - (baseTransform[1] || 0);

            const $layer = $("<div>")
                .addClass(`button-state-layer state-${i}`)
                .css({
                    width: `${current[2] || 10}px`,
                    height: `${current[3] || 10}px`,
                    transform: `translate(${layerX}px, ${layerY}px)`,
                    "background-image": imageSrc ? `url('${imageSrc}')` : "none",
                });

            $button.append($layer);
        }

        super.syncDom();
    }

    setupClickListener() {
        if (!this.domElement) return;

        $(this.domElement).on("click", e => {
            // Block click when disabled (manual or via scene)
            const sceneEnabled = this.scene ? this.scene.isFocusable : true;
            const effectiveEnabled =
                this.manualEnabled === true ? true : this.manualEnabled === false ? false : sceneEnabled;
            if (!effectiveEnabled) {
                e.preventDefault();
                return;
            }
            if (this.onClickHandler) this.onClickHandler();
        });
    }

    onClick(callback: () => void) {
        this.onClickHandler = callback;
        this.setupClickListener();
    }

    updateDOMStyle() {
        if (!this.domElement) return;
        $(this.domElement).css(
            this.buildBaseStyle({
                cursor: this.cursor,
                background: "transparent",
            }),
        );
    }
}

export interface ToButtonOptions {
    stateIndexes?: number[];
    defaultTransform?: [number | null, number | null, number | null, number | null];
    z?: number;
    cursor?: string;
    callback?: () => void;
    focusable?: boolean;
    visible?: boolean;
    flags?: string[];
    disabled?: boolean;
}

export function toButton(group: SceneElement | null, options: Partial<ToButtonOptions> = {}) {
    if (!group) {
        console.error("toButton called with null group");
        return null;
    }
    const {
        stateIndexes = [0, 1, 2, 0],
        defaultTransform = [null, null, null, null],
        z = 0,
        cursor = "pointer",
        callback = null,
        focusable = true,
        visible = true,
        flags = [],
        disabled = false,
    } = options;
    if (!Array.isArray(group.children) || group.children.length === 0) {
        console.error("Group must have children to elevate to Button");
        return null;
    }

    const transforms: Array<[number, number, number, number]> = [];
    const images: string[] = [];

    stateIndexes.forEach(stateIndex => {
        const layer = stateIndex >= 0 ? group.children[stateIndex] : null;

        transforms.push([
            layer?.x || defaultTransform[0] || 0,
            layer?.y || defaultTransform[1] || 0,
            layer?.width || defaultTransform[2] || 10,
            layer?.height || defaultTransform[3] || 10,
        ]);
        images.push(layer ? (layer.domElement as HTMLImageElement)?.src || layer.sceneData.path || "" : "");
    });

    const buttonData = {
        ...group.sceneData,
        transforms,
        z,
        cursor,
        images,
        zIndex: group.zIndex,
        callback,
        focusable,
        visible,
        flags,
        disabled,
    } as ButtonData;

    const button = new Button(buttonData, group.parent, group.scene);
    window.getEngine().getTopScene().addObject(button);

    // Destroy all children first
    group.children.forEach(child => child.destroy());

    // Preserve the layer index in the parent's children array
    preserveLayerIndex(group, button);

    return button;
}
