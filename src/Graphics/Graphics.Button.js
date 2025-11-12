import { FocusableElement } from './Graphics.FocusableElement.js';
import { preserveLayerIndex } from './Graphics.SceneElement.js';

export class Button extends FocusableElement {
    constructor(data, parent = null, scene) {
        data.isButton = true;
        
        super(data, parent, scene);

        this.transforms = data.transforms || [];
        this.width = this.transforms[0]?.[2] || 10;
        this.height = this.transforms[0]?.[3] || 10;

        this.images = data.images;
        this.onClickHandler = null;
        this.buttonId = `btn-${Math.random().toString(36).substr(2, 9)}`;
        this.isButton = true;
        this.transform.z = data.z || 0;
        this.cursor = data.cursor || 'pointer';
        
        this.recreateDOMAsButton();
        this.injectCSSRules();
        if(data.callback) this.onClick(data.callback);
    }

    recreateDOMAsButton() {
        let classNames = ''
        if (this.domElement) {
            classNames = $(this.domElement).attr('class').split(' ');
            $(this.domElement).remove();
        }
        
        this.domElement = $('<button>')
            .attr('id', this.buttonId)
            .attr('layer-name', this.sceneData.name || 'Button')
            .attr('class', classNames)
            .css({
                opacity: this.opacity,
                'mix-blend-mode': this.blendMode,
                cursor: this.cursor,
                display: this.visible ? 'block' : 'none'
            })
            [0];
        
        super.syncDom();
    }

    injectCSSRules() {
        let $styleSheet = $('#button-styles');
        if (!$styleSheet.length) {
            $styleSheet = $('<style id="button-styles"></style>');
            $('head').append($styleSheet);
        }

        const sheet = $styleSheet[0].sheet;
        sheet.insertRule(`#${this.buttonId} { background-image: url('${this.images[0]}'); width: ${this.transforms[0]?.[2] || 10}px; height: ${this.transforms[0]?.[3] || 10}px; transform: translate(${this.transforms[0]?.[0] || 0}px, ${this.transforms[0]?.[1] || 0}px); }`, sheet.cssRules.length);
        sheet.insertRule(`#${this.buttonId}:hover, #${this.buttonId}:focus { background-image: url('${this.images[1]}'); width: ${this.transforms[1]?.[2] || 10}px; height: ${this.transforms[1]?.[3] || 10}px; transform: translate(${this.transforms[1]?.[0] || 0}px, ${this.transforms[1]?.[1] || 0}px); outline: none; }`, sheet.cssRules.length);
        sheet.insertRule(`#${this.buttonId}:active, #${this.buttonId}.active:focus { background-image: url('${this.images[2]}'); width: ${this.transforms[2]?.[2] || 10}px; height: ${this.transforms[2]?.[3] || 10}px; transform: translate(${this.transforms[2]?.[0] || 0}px, ${this.transforms[2]?.[1] || 0}px); }`, sheet.cssRules.length);
    }

    setupClickListener() {
        if (!this.domElement) return;
        
        $(this.domElement).on('click', (e) => {
            // Block click when disabled (manual or via scene)
            const sceneEnabled = this.scene ? this.scene.isFocusable : true;
            const effectiveEnabled = this.manualEnabled === true ? true : (this.manualEnabled === false ? false : sceneEnabled);
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
            'z-index': this.transform.z + baseZOffset,
            'mix-blend-mode': this.blendMode,
            display: this.visible ? 'block' : 'none',
            cursor: this.cursor
        });
    }
}

export function toButton(group, options = {}) {
    const {
        stateIndexes = [0, 1, 2, 0],
        defaultTransform = [null, null, null, null],
        z = 0, cursor = 'pointer',
        callback = null,
        focusable = true
    } = options;

    if (!Array.isArray(group.children) || group.children.length === 0) {
        console.error('Group must have children to elevate to Button');
        return null;
    }

    const transforms = [];
    const images = [];

    stateIndexes.forEach((stateIndex) => {
        const layer = stateIndex >= 0 ? group.children[stateIndex] : null;

        transforms.push([
            layer?.x || defaultTransform[0] || 0, layer?.y || defaultTransform[1] || 0,
            layer?.width || defaultTransform[2] || 10, layer?.height || defaultTransform[3] || 10
        ]);
        images.push(layer ? (layer.domElement?.src || layer.sceneData.path) : '');
    });

    const buttonData = {
        ...group.sceneData,
        transforms,
        z, cursor,
        images,
        zIndex: group.zIndex,
        callback,
        focusable
    };

    const button = new Button(buttonData, group.parent, group.scene);
    window.getEngine().getTopScene().addObject(button);

    // Destroy all children first
    group.children.forEach(child => child.destroy());
    
    // Preserve the layer index in the parent's children array
    preserveLayerIndex(group, button);

    return button;
}
