
// Handle keyboard navigation
const CONFIRM_KEYS = [13, 74, 90]; // Enter(Keyboard), J(Keyboard Joysdick), Z(Touhou)
const CANCEL_KEYS = [27, 75, 88]; // Esc(Keyboard), K(Keyboard Joystick), X(Touhou)
const NAVIGATION_KEYS = {
    40: 'next', 39: 'next', 38: 'prev', 37: 'prev', // arrow keys
    83: 'next', 87: 'prev', 65: 'prev', 68: 'next'  // WASD keys
};

let confirmListener = null;
let exitListener = null;
// Single-flight guard state for exit listener to prevent duplicate scene pushes
let exitListenerInFlight = false;
let exitListenerOptions = { singleFlight: false };
let overrideRightKeys = false;

// Skipping state
window.skipping = false;

export function setConfirmListener(fn) { confirmListener = fn; }
export function setExitListener(fn, options = {}) {
    exitListenerOptions = { singleFlight: true, ...options };
    // Wrap the original listener if singleFlight enabled
    if (!fn) { exitListener = null; return; }
    if (!exitListenerOptions.singleFlight) {
        exitListener = fn;
        return;
    }
    exitListener = async (e) => {
        if (exitListenerInFlight) return; // drop repeated triggers while running
        try {
            exitListenerInFlight = true;
            const result = fn(e);
            // Support both sync and async handlers
            if (result && typeof result.then === 'function') {
                await result;
            }
        } finally {
            exitListenerInFlight = false;
        }
    };
}
export function clearKeyboardListeners() { confirmListener = null; exitListener = null; exitListenerInFlight = false; }

export function setOverrideRightKeys(override) {
    overrideRightKeys = override;
    // remove all right-click listeners if overriding
    $(document).off('contextmenu');
    $(document).on('contextmenu', function(e) {
        if(exitListener && !overrideRightKeys) {
            exitListener(e); e.preventDefault();
        }
    });
}

$(document).on('keydown', function(e) {
    // Handle Ctrl key for skipping
    if (e.keyCode === 17 && !window.skipping && !window.isSelecting) { // Ctrl key
        window.skipping = true;
        // Trigger the first line advance immediately
        setTimeout(() => {
            if (window.skipping) {
                document.dispatchEvent(new CustomEvent('SkipModeStarted', { bubbles: true }));
            }
        }, 50);
    }
    
    const $focused = $('.focusable:focus');
    const op = NAVIGATION_KEYS[e.keyCode];
    if(!$focused.length && (Object.keys(NAVIGATION_KEYS).includes(e.keyCode.toString()))) {
        $('.focusable')[{'prev': 'last', 'next': 'first'}[op]]().focus(); return;
    }
    if(CONFIRM_KEYS.includes(e.keyCode)) {
        $focused.addClass('active'); e.preventDefault(); return;
    }
    if(CANCEL_KEYS.includes(e.keyCode) && exitListener) {
        exitListener(e); e.preventDefault(); return;
    }
    if(!op) return;
    let $current = $focused;
    $current.removeClass('active');
    while (true) {
        const $target = $current[op]('.focusable');
        if(!$target.length) break;
        if($target.is(':visible')) {
            $target.focus();
            break;
        }
        $current = $target;
    }
});
$(document).on('keyup', function(e) {
    // Handle Ctrl key release to stop skipping
    if (e.keyCode === 17 && window.skipping) { // Ctrl key
        window.skipping = false;
    }
    
    if(CONFIRM_KEYS.includes(e.keyCode)) {
        const $focused = $('.focusable:focus');
        if($focused.length) {
            $focused.removeClass('active');
            if(confirmListener) {
                confirmListener(e, $focused);
            } else {
                $focused.click();
            }
        }
    }
});
$(document).on('contextmenu', function(e) {
    if(exitListener && !overrideRightKeys) {
        exitListener(e); e.preventDefault();
    }
});
