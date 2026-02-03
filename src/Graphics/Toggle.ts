import type { IScene } from "@/Scene/Scene";
import { Button, toButton, type ButtonData, type ToButtonOptions } from "./Button";
import { preserveLayerIndex, type SceneElement } from "./SceneElement";

export interface ToggleData extends ButtonData {}

export class Toggle extends Button {
    constructor(data: ToggleData, parent: SceneElement | null = null, scene: IScene | null = null) {
        data.isButton = true;

        super(data, parent, scene);

        this.buttonId = `toggle-${Math.random().toString(36).substr(2, 9)}`;
        this.isButton = true;
        this.transform.z = data.z || 0;
        this.cursor = data.cursor || "pointer";

        this.recreateDOMAsToggle();
        this.injectCSSRules();
        if (data.callback) this.onClick(data.callback);
    }

    recreateDOMAsToggle() {
        super.recreateDOMAsButton();
    }

    injectCSSRules() {
        super.injectCSSRules();
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
        const baseZOffset = this.scene?.baseZOffset || 0;
        $(this.domElement).css({
            opacity: this.opacity,
            "z-index": this.transform.z + baseZOffset,
            "mix-blend-mode": this.blendMode,
            display: this.visible ? "block" : "none",
            cursor: this.cursor,
        });
    }
}

export function toToggle(group: SceneElement, options: Partial<ToButtonOptions> = {}) {
    const button = toButton(group, options);

    const toggle = new Toggle(buttonData, group.parent, group.scene);
    window.getEngine().getTopScene().addObject(toggle);

    // Destroy all children first
    group.children.forEach(child => child.destroy());

    // Preserve the layer index in the parent's children array
    preserveLayerIndex(group, toggle);

    return toggle;
}
