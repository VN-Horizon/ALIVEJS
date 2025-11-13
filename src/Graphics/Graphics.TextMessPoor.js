import { SceneElement } from './Graphics.SceneElement.js';

export class TMP_Text extends SceneElement {
    constructor(data, parent = null, scene = null) {
        super(data, parent, scene);

        this.text = data.text || '';
        this.fontSize = data.fontSize || 16;
        this.fontFamily = data.fontFamily || '';
        this.fontWeight = data.fontWeight || 'normal';
        this.color = data.color || '#000000';
        
        this.setText(this.text);
        this.updateTextStyle();
    }

    createDOMElement() {
        this.domElement = $('<span>')
            .attr('layer-name', this.sceneData.name || '')
            .text(this.text)
            .css(this.buildBaseStyle())[0];
        super.syncDom();
    }

    buildBaseStyle(extra = {}) {
        const baseStyle = super.buildBaseStyle({
            'font-size': `${this.fontSize}px`,
            'color': this.color,
            'display': this.visible ? 'inline-block' : 'none',
            'font-family': this.fontFamily,
            'font-weight': this.fontWeight,
            ...extra
        });
        
        return baseStyle;
    }

    async loadImage(path) {
        return;
    }

    setText(newText) {
        this.text = newText;
        if (this.domElement) {
            $(this.domElement).text(this.text);
        }
    }

    updateTextStyle() {
        if (!this.domElement) return;
        this.updateDOMStyle();
    }

    setFontOptions({ size, family, weight }) {
        if (size) this.fontSize = size;
        if (family) this.fontFamily = family;
        if (weight) this.fontWeight = weight;
        this.updateTextStyle();
    }
}

export class TMP_TypeWriter extends TMP_Text {
    constructor(data, parent = null, scene = null) {
        super(data, parent, scene);
        
        this.fullText = this.text;
        this.currentCharIndex = 0;
        this.isAnimating = false;
        this.charsPerSecond = data.charsPerSecond || 30;
        this.timeAccumulator = 0;
        
        this.cancelAnimation();
        this.setText(this.text);
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        if (!this.isAnimating || this.currentCharIndex >= this.fullText.length) {
            if (this.isAnimating) {
                this.isAnimating = false;
                this.setText(this.fullText);
            }
            return;
        }

        // Skip animation immediately if skipping is enabled
        if (window.skipping) {
            this.cancelAnimation();
            return;
        }

        this.timeAccumulator += deltaTime;
        const timePerChar = 1.0 / this.charsPerSecond;

        while (this.timeAccumulator >= timePerChar && this.currentCharIndex < this.fullText.length) {
            this.timeAccumulator -= timePerChar;
            this.currentCharIndex++;
            super.setText(this.fullText.substring(0, this.currentCharIndex));
        }
    }

    cancelAnimation() {
        this.isAnimating = false;
        this.currentCharIndex = this.fullText.length;
        super.setText(this.fullText);
        this.timeAccumulator = 0;
    }

    animateText(newText) {
        if(this.fullText == newText && this.isAnimating) {
            this.cancelAnimation();
            return;
        }
        this.fullText = newText;
        this.isAnimating = true;
        this.currentCharIndex = 0;
        this.timeAccumulator = 0;
        this.setText('');
    }
}
