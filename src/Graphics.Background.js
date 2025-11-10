class Background extends SceneElement {
    constructor(data, parent = null, scenePath = '') {
        data.isBackground = true;

        super(data, parent, scenePath);
        
        this.backgroundId = `bg-${Math.random().toString(36).substr(2, 9)}`;
        this.backgroundImageUrl = null;
        this.backgroundSize = data.backgroundSize || 'cover';
        this.backgroundPosition = data.backgroundPosition || 'center';
        this.backgroundRepeat = data.backgroundRepeat || 'no-repeat';
        
        // Infinite scroll properties
        this.scrollSpeed = {
            x: data.scrollSpeedX || 0,
            y: data.scrollSpeedY || 0
        };
        this.scrollOffset = { x: 0, y: 0 };
        
        this.recreateDOMAsBackground();
    }

    recreateDOMAsBackground() {
        if (this.domElement) {
            $(this.domElement).remove();
        }
        
        this.domElement = $('<div>')
            .attr('id', this.backgroundId)
            .attr('layer-name', this.sceneData.name || 'Background')
            .css(this.buildBaseStyle({
                'background-size': this.backgroundSize,
                'background-repeat': this.backgroundRepeat
            }))
            [0];
        
        this.syncDOM();
    }

    async loadImage(path) {
        const fullImagePath = `/assets/scenes/${this.scenePath}/${path}.webp`;
        this.updateBackgroundImage(fullImagePath);
    }

    updateBackgroundImage(backgroundImageUrl = null) {
        if (!this.domElement || !backgroundImageUrl) return;
        this.backgroundImageUrl = backgroundImageUrl;
        $(this.domElement).css('background-image', `url('${this.backgroundImageUrl}')`);
        this.updateScrollPosition();
    }

    updateScrollPosition() {
        if (!this.domElement) return;
        $(this.domElement).css('background-position', `${this.scrollOffset?.x || 0}px ${this.scrollOffset?.y || 0}px`);
    }

    resetScrollOffset() {
        this.scrollOffset.x = 0;
        this.scrollOffset.y = 0;
        this.updateScrollPosition();
    }

    update(deltaTime) {
        if (this.scrollSpeed.x === 0 && this.scrollSpeed.y === 0) {
            return;
        }

        if(isNaN(this.scrollOffset.x) || isNaN(this.scrollOffset.y)) {
            this.scrollOffset.x = 0;
            this.scrollOffset.y = 0;
        }
        this.scrollOffset.x += this.scrollSpeed.x * deltaTime;
        this.scrollOffset.y += this.scrollSpeed.y * deltaTime;

        this.updateScrollPosition();
    }
}

function toBackground(element, options = {}) {
    const {
        backgroundSize = 'cover',
        backgroundPosition = 'center',
        backgroundRepeat = 'repeat',
        scrollSpeedX = 0,
        scrollSpeedY = 0,
    } = options;

    if (!element || !element.sceneData) {
        console.error('Element must be a valid SceneElement to elevate to Background');
        return null;
    }

    console.log('Elevating element to Background:', element);

    const backgroundData = {
        ...element.sceneData,
        backgroundSize,
        backgroundPosition,
        backgroundRepeat,
        scrollSpeedX,
        scrollSpeedY
    };

    const background = new Background(backgroundData, element.parent, element.scenePath);
    background.loadImage(element.sceneData.path);

    // Destroy original element
    element.destroy();

    return background;
}

// Export as globals
window.Background = Background;
window.toBackground = toBackground;
