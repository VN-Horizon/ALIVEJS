class Button extends SceneElement {
    constructor(data, parent = null, scenePath = '') {
        data.isButton = true;
        
        super(data, parent, scenePath);

        this.sizes = data.sizes || { normal: { width: 100, height: 50 }, hovered: { width: 100, height: 50 }, clicked: { width: 100, height: 50 } };
        this.width = this.sizes.normal.width;
        this.height = this.sizes.normal.height;
        this.pos = data.pos || { normal: { x: 0, y: 0 }, hovered: { x: 0, y: 0 }, clicked: { x: 0, y: 0 } };

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
        
        this.syncDOM();
    }

    injectCSSRules() {
        let $styleSheet = $('#button-styles');
        if (!$styleSheet.length) {
            $styleSheet = $('<style id="button-styles"></style>');
            $('head').append($styleSheet);
        }

        const sheet = $styleSheet[0].sheet;
        sheet.insertRule(`#${this.buttonId} { background-image: url('${this.images[0]}'); width: ${this.sizes.normal.width}px; height: ${this.sizes.normal.height}px; transform: translate(${this.pos.normal.x}px, ${this.pos.normal.y}px); }`, sheet.cssRules.length);
        sheet.insertRule(`#${this.buttonId}:hover, #${this.buttonId}:focus { background-image: url('${this.images[1]}'); width: ${this.sizes.hovered.width}px; height: ${this.sizes.hovered.height}px; transform: translate(${this.pos.hovered.x}px, ${this.pos.hovered.y}px); outline: none; }`, sheet.cssRules.length);
        sheet.insertRule(`#${this.buttonId}:active, #${this.buttonId}.active:focus { background-image: url('${this.images[2]}'); width: ${this.sizes.clicked.width}px; height: ${this.sizes.clicked.height}px; transform: translate(${this.pos.clicked.x}px, ${this.pos.clicked.y}px); }`, sheet.cssRules.length);
    }

    setupClickListener() {
        console.log('Setting up click listener for button:', this);
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
        disabledChildIndex = 0,
        normalChildIndex = 0,
        hoveredChildIndex = 1,
        clickedChildIndex = 2,
        callback = null
    } = options;

    if (!group.children || group.children.length === 0) {
        console.error('Group must have at least 1 children to elevate to Button');
        return null;
    }

    const normalLayer = group.children[normalChildIndex];
    const hoveredLayer = group.children[hoveredChildIndex];
    const clickedLayer = group.children[clickedChildIndex];
    const disabledLayer = group.children[disabledChildIndex];

    console.log('Creating button from group:', group.children);
    if (!normalLayer || !hoveredLayer || !clickedLayer || !disabledLayer) {
        console.error('One or more child layers not found at specified indices');
        return null;
    }

    const buttonData = {
        ...group.sceneData,
        pos: {
            normal: { x: normalLayer.x, y: normalLayer.y },
            hovered: { x: hoveredLayer.x, y: hoveredLayer.y },
            clicked: { x: clickedLayer.x, y: clickedLayer.y },
            disabled: { x: disabledLayer.x, y: disabledLayer.y }
        },
        sizes: {
            normal: { width: normalLayer.width, height: normalLayer.height },
            hovered: { width: hoveredLayer.width, height: hoveredLayer.height },
            clicked: { width: clickedLayer.width, height: clickedLayer.height },
            disabled: { width: disabledLayer.width, height: disabledLayer.height }
        },
        images:[
            normalLayer.domElement?.src || normalLayer.sceneData.path,
            hoveredLayer.domElement?.src || hoveredLayer.sceneData.path,
            clickedLayer.domElement?.src || clickedLayer.sceneData.path,
            disabledLayer.domElement?.src || disabledLayer.sceneData.path
        ],
        zIndex: group.zIndex,
        callback
    };

    const button = new Button(buttonData, group.parent, group.scenePath);

    // Remove original group and its children
    group.children.forEach(child => child.destroy());
    group.destroy();

    return button;
}

window.Button = Button;
window.toButton = toButton;
