
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
window.overrideRightKeys = false;

function setConfirmListener(fn) { confirmListener = fn; }
function setExitListener(fn, options = {}) {
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
function clearKeyboardListeners() { confirmListener = null; exitListener = null; exitListenerInFlight = false; }

$(document).on('keydown', function(e) {
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
    if(exitListener && !window.overrideRightKeys) {
        exitListener(e); e.preventDefault();
    }
});

window.setOverrideRightKeys = function(override) {
    window.overrideRightKeys = override;
    // remove all right-click listeners if overriding
    $(document).off('contextmenu');
    $(document).on('contextmenu', function(e) {
        if(exitListener && !window.overrideRightKeys) {
            exitListener(e); e.preventDefault();
        }
    });
};
// Gamepad support
let gamepadState = {
    buttons: [],
    axes: [],
    lastUpdate: 0
};
const GAMEPAD_DEADZONE = 0.3;
const GAMEPAD_REPEAT_DELAY = 200;
let lastNavigationTime = 0;

// Gamepad polling loop
function pollGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gamepad = gamepads[0]; // Use first connected gamepad
    
    if (!gamepad) {
        requestAnimationFrame(pollGamepad);
        return;
    }
    
    const now = Date.now();
    const $focused = $('.focusable:focus');
    
    // Confirm
    if (gamepad.buttons[0]?.pressed && !gamepadState.buttons[0]) {
        if ($focused.length) {
            $focused.addClass('active');
        } else {
            $('.focusable').first().focus().addClass('active');
        }
    } else if (!gamepad.buttons[0]?.pressed && gamepadState.buttons[0]) {
        const $current = $('.focusable:focus');
        if ($current.length) {
            $current.removeClass('active');
            if (confirmListener) {
                confirmListener(null, $current);
            } else {
                $current.click();
            }
        }
    }
    
    // Cancel
    if (gamepad.buttons[1]?.pressed && !gamepadState.buttons[1]) {
        if (exitListener) {
            console.log('Gamepad cancel button pressed');
            exitListener(null);
        }
    }
    
    // D-pad and analog stick navigation
    let navigationDirection = null;
    if (gamepad.buttons[12]?.pressed) navigationDirection = 'prev';
    else if (gamepad.buttons[13]?.pressed) navigationDirection = 'next';
    else if (gamepad.buttons[14]?.pressed) navigationDirection = 'prev';
    else if (gamepad.buttons[15]?.pressed) navigationDirection = 'next';
    if (!navigationDirection) {
        if (gamepad.axes[1] < -GAMEPAD_DEADZONE) navigationDirection = 'prev';
        else if (gamepad.axes[1] > GAMEPAD_DEADZONE) navigationDirection = 'next';
        else if (gamepad.axes[0] < -GAMEPAD_DEADZONE) navigationDirection = 'prev';
        else if (gamepad.axes[0] > GAMEPAD_DEADZONE) navigationDirection = 'next';
    }
    
    // Navigation with repeat delay
    if (navigationDirection && (now - lastNavigationTime > GAMEPAD_REPEAT_DELAY)) {
        if (!$focused.length) {
            $('.focusable').first().focus();
        } else {
            let $current = $focused;
            $current.removeClass('active');
            while (true) {
                const $target = $current[navigationDirection]('.focusable');
                if (!$target.length) break;
                if ($target.is(':visible')) {
                    $target.focus();
                    break;
                }
                $current = $target;
            }
        }
        lastNavigationTime = now;
    }
    
    // Store button states for next frame
    gamepadState.buttons = gamepad.buttons.map(b => b?.pressed || false);
    gamepadState.axes = [...gamepad.axes];
    
    requestAnimationFrame(pollGamepad);
}

// Start gamepad polling when a gamepad is connected
window.addEventListener('gamepadconnected', (e) => {
    console.log('Gamepad connected:', e.gamepad.id);
    pollGamepad();
});

// Initialize gamepad polling if already connected
if (navigator.getGamepads) {
    const gamepads = navigator.getGamepads();
    if (gamepads[0]) {
        console.log('Gamepad already connected:', gamepads[0].id);
        pollGamepad();
    }
}