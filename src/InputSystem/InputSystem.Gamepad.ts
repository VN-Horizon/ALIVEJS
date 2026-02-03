import $ from 'jquery';
import { confirmListener, exitListener } from './InputSystem.Keyboard';

// Gamepad support
const gamepadState = {
    buttons: [] as boolean[],
    axes: [] as number[],
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
                $current.trigger("click");
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
    let navigationDirection: 'prev' | 'next' | null = null;
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
            $('.focusable').first().trigger('focus');
        } else {
            let $current = $focused;
            $current.removeClass('active');
            while (true) {
                const $target = $current[navigationDirection]('.focusable');
                if (!$target.length) break;
                if ($target.is(':visible')) {
                    $target.trigger('focus');
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