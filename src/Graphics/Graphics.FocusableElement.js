import { SceneElement } from './Graphics.SceneElement.js';

export class FocusableElement extends SceneElement {
    constructor(data, parent = null, scene) {
        super(data, parent, scene);

        this.manualEnabled = null;
        this.permanentlyNonFocusable = data && data.focusable === false;

        if (this.permanentlyNonFocusable) {
            console.log('Element ' + (data.name || '') + ' set as non-focusable by data.');
            $(this.domElement).attr('tabindex', '-1').addClass('non-focusable');
        } else {
            $(this.domElement).addClass('focusable');
        }

        this.updateFocusability();
    }

    setEnabled(enabled) {
        this.manualEnabled = enabled;
        this.updateFocusability();
    }

    applyInteractableState(enabled) {
        if (!this.domElement) return;
        const $el = $(this.domElement);
        if (enabled) {
            $el.css('pointer-events', 'auto');
            $el.removeAttr('tabindex');
            $el.prop('disabled', false);
            $el.removeClass('non-focusable').addClass('focusable');
        } else {
            if (this.scene && $el.is(':focus')) this.scene.lastFocusedElement = this.domElement;
            $el.css('pointer-events', 'none');
            $el.attr('tabindex', '-1');
            $el.prop('disabled', true);
            if ($el.is(':focus')) $el.blur();
            $el.removeClass('focusable').addClass('non-focusable');
        }
    }

    updateFocusability() {
        if (!this.domElement) return;
        // If permanently non-focusable via data.focusable === false, never enable
        if (this.permanentlyNonFocusable) {
            this.applyInteractableState(false);
            return;
        }
        if (this.manualEnabled === true) {
            this.applyInteractableState(true);
            return;
        }
        if (this.manualEnabled === false) {
            this.applyInteractableState(false);
            return;
        }
        // Follow scene state when manualEnabled is null
        const isSceneFocusable = this.scene ? this.scene.isFocusable : true;
        this.applyInteractableState(!!isSceneFocusable);
    }

    setFocus() {
        if (!this.domElement) return false;
        const $el = $(this.domElement);

        const isFocusableNow = !$el.prop('disabled')
            && $el.attr('tabindex') !== '-1'
            && ($el.css('pointer-events') || '').toLowerCase() !== 'none'
            && $el.is(':visible')
            && $el.hasClass('focusable') && !$el.hasClass('non-focusable')
            && this.scene ? this.scene.isFocusable !== false : true;

        if (!isFocusableNow) return false;

        // Remember last focused element in the scene, if applicable
        if (this.scene) this.scene.lastFocusedElement = this.domElement;

        try {
            // Prefer native focus with preventScroll to avoid jumping
            if (typeof this.domElement.focus === 'function') {
                this.domElement.focus({ preventScroll: true });
            } else {
                $el.trigger('focus');
            }
        } catch (e) {
            // Fallback if options aren't supported
            try { this.domElement.focus(); } catch (_) {}
        }

        return document && document.activeElement === this.domElement;
    }

    static updateFocusabilityRecursive(obj) {
        if (!obj) return;
        if (typeof obj.updateFocusability === 'function') obj.updateFocusability();
        if (obj.children && obj.children.length) {
            obj.children.forEach(child => FocusableElement.updateFocusabilityRecursive(child));
        }
    }
}
