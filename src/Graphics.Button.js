class Button extends SceneElement {
    constructor(data, parent = null, scenePath = '') {
        data.isButton = true;
        
        super(data, parent, scenePath);

        this.transforms = data.transforms || [];
        this.width = this.transforms[0]?.[2] || 10;
        this.height = this.transforms[0]?.[3] || 10;

        this.images = data.images;
        this.onClickHandler = null;
        this.buttonId = `btn-${Math.random().toString(36).substr(2, 9)}`;
        this.isButton = true;
        
        this.recreateDOMAsButton();
        this.injectCSSRules();
        if(data.callback) this.onClick(data.callback);
    }

    recreateDOMAsButton() {
        if (this.domElement) {
            $(this.domElement).remove();
        }
        
        this.domElement = $('<button>')
            .attr('id', this.buttonId)
            .addClass('focusable')
            .attr('layer-name', this.sceneData.name || 'Button')
            .css({
                opacity: this.opacity,
                'mix-blend-mode': this.blendMode,
                'z-index': this.zIndex,
                display: this.visible ? 'block' : 'none'
            })
            [0];
        
        super.update(1);
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
        
        $(this.domElement).on('click', () => {
            if (this.onClickHandler) this.onClickHandler();
        });
    }

    onClick(callback) {
        this.onClickHandler = callback;
        this.setupClickListener();
    }

    updateDOMStyle() {
        if (!this.domElement) return;
        $(this.domElement).css({
            opacity: this.opacity,
            'z-index': this.zIndex,
            'mix-blend-mode': this.blendMode,
            display: this.visible ? 'block' : 'none'
        });
    }
}

function toButton(group, options = {}) {
    const {
        stateIndexes = [0, 1, 2, 0],
        defaultTransform = [null, null, null, null],
        callback = null
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
        images,
        zIndex: group.zIndex,
        callback
    };

    const button = new Button(buttonData, group.parent, group.scenePath);
    window.getEngine().getTopScene().addObject(button);

    // Destroy all children first
    group.children.forEach(child => child.destroy());
    
    // Preserve the layer index in the parent's children array
    preserveLayerIndex(group, button);

    return button;
}

window.Button = Button;
window.toButton = toButton;
