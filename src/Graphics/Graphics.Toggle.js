import { toButton } from "./Graphics.Button.js";
import { preserveLayerIndex } from "./Graphics.SceneElement";

export class Toggle extends Button {
    constructor(data, parent = null, scene) {
        data.isButton = true;

        super(data, parent, scene);

        this.buttonId = `toggle-${Math.random().toString(36).substr(2, 9)}`;
        this.isButton = true;
        this.transform.z = data.z || 0;
        this.cursor = data.cursor || "pointer";

        this.recreateDOMAsButton();
        this.injectCSSRules();
        if (data.callback) this.onClick(data.callback);
    }

    recreateDOMAsButton() {
        let classNames = "";
        if (this.domElement) {
            classNames = $(this.domElement).attr("class").split(" ");
            $(this.domElement).remove();
        }

        this.domElement = $("<button>")
            .attr("id", this.buttonId)
            .attr("layer-name", this.sceneData.name || "Button")
            .attr("class", classNames)
            .css({
                opacity: this.opacity,
                "mix-blend-mode": this.blendMode,
                cursor: this.cursor,
                display: this.visible ? "block" : "none",
            })[0];

        super.syncDom();
    }

    injectCSSRules() {
        let $styleSheet = $("#button-styles");
        if (!$styleSheet.length) {
            $styleSheet = $('<style id="button-styles"></style>');
            $("head").append($styleSheet);
        }

        const sheet = $styleSheet[0].sheet;
        sheet.insertRule(
            `#${this.buttonId} { background-image: url('${this.images[0]}'); width: ${this.transforms[0]?.[2] || 10}px; height: ${this.transforms[0]?.[3] || 10}px; transform: translate(${this.transforms[0]?.[0] || 0}px, ${this.transforms[0]?.[1] || 0}px); }`,
            sheet.cssRules.length,
        );
        sheet.insertRule(
            `#${this.buttonId}:hover, #${this.buttonId}:focus { background-image: url('${this.images[1]}'); width: ${this.transforms[1]?.[2] || 10}px; height: ${this.transforms[1]?.[3] || 10}px; transform: translate(${this.transforms[1]?.[0] || 0}px, ${this.transforms[1]?.[1] || 0}px); outline: none; }`,
            sheet.cssRules.length,
        );
        sheet.insertRule(
            `#${this.buttonId}:active, #${this.buttonId}.active:focus { background-image: url('${this.images[2]}'); width: ${this.transforms[2]?.[2] || 10}px; height: ${this.transforms[2]?.[3] || 10}px; transform: translate(${this.transforms[2]?.[0] || 0}px, ${this.transforms[2]?.[1] || 0}px); }`,
            sheet.cssRules.length,
        );
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

    onClick(callback) {
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

export function toToggle(group, options = {}) {
    const button = toButton(group, options);

    const toggle = new Toggle(buttonData, group.parent, group.scene);
    window.getEngine().getTopScene().addObject(toggle);

    // Destroy all children first
    group.children.forEach(child => child.destroy());

    // Preserve the layer index in the parent's children array
    preserveLayerIndex(group, toggle);

    return toggle;
}
