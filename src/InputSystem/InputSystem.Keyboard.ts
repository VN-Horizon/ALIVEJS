import $ from "jquery";

declare global {
    interface Window {
        skipping: boolean;
        isSelecting: boolean;
    }
}

// Handle keyboard navigation
const CONFIRM_KEYS = ["Enter", "KeyJ", "KeyZ"]; // Enter(Keyboard), J(Keyboard Joysdick), Z(Touhou)
const CANCEL_KEYS = ["Escape", "KeyK", "KeyX"]; // Esc(Keyboard), K(Keyboard Joystick), X(Touhou)
const NAVIGATION_KEYS: Record<string, "next" | "prev"> = {
    ArrowDown: "next",
    ArrowRight: "next",
    ArrowUp: "prev",
    ArrowLeft: "prev",
    KeyS: "next",
    KeyD: "next",
    KeyW: "prev",
    KeyA: "prev",
};

export type ConfirmListener = (e: JQuery.KeyUpEvent | null, focused: JQuery<HTMLElement>) => void;
export type ExitListener = (e: JQuery.KeyDownEvent | JQuery.ContextMenuEvent | null) => void | Promise<void>;

export let confirmListener: ConfirmListener | null = null;
export let exitListener: ExitListener | null = null;
// Single-flight guard state for exit listener to prevent duplicate scene pushes
let exitListenerInFlight = false;
let exitListenerOptions = { singleFlight: false };
let overrideRightKeys = false;

// Skipping state
window.skipping = false;

export function setConfirmListener(fn: ConfirmListener) {
    confirmListener = fn;
}
export function setExitListener(fn: ExitListener, options = {}) {
    exitListenerOptions = { singleFlight: true, ...options };
    // Wrap the original listener if singleFlight enabled
    if (!fn) {
        exitListener = null;
        return;
    }
    if (!exitListenerOptions.singleFlight) {
        exitListener = fn;
        return;
    }
    exitListener = async e => {
        if (exitListenerInFlight) return; // drop repeated triggers while running
        try {
            exitListenerInFlight = true;
            const result = fn(e);
            // Support both sync and async handlers
            if (result && typeof result.then === "function") {
                await result;
            }
        } finally {
            exitListenerInFlight = false;
        }
    };
}
export function clearKeyboardListeners() {
    confirmListener = null;
    exitListener = null;
    exitListenerInFlight = false;
}

export function setOverrideRightKeys(override: boolean) {
    overrideRightKeys = override;
    // remove all right-click listeners if overriding
    $(document).off("contextmenu");
    $(document).on("contextmenu", function (e) {
        if (exitListener && !overrideRightKeys) {
            exitListener(e);
            e.preventDefault();
        }
    });
}

$(document).on("keydown", function (e) {
    // Handle Ctrl key for skipping
    if (e.key === "Control" && !window.skipping && !window.isSelecting) {
        // Ctrl key
        window.skipping = true;
        // Trigger the first line advance immediately
        setTimeout(() => {
            if (window.skipping) {
                document.dispatchEvent(new CustomEvent("SkipModeStarted", { bubbles: true }));
            }
        }, 50);
    }

    const $focused = $(".focusable:focus");
    const op = NAVIGATION_KEYS[e.code];
    // Use explicit check for key existing in NAVIGATION_KEYS
    if (!$focused.length && e.code in NAVIGATION_KEYS) {
        const $focusable = $(".focusable");
        const $target = op === "prev" ? $focusable.last() : $focusable.first();
        $target.trigger("focus");
        return;
    }
    if (CONFIRM_KEYS.includes(e.code)) {
        $focused.addClass("active");
        e.preventDefault();
        return;
    }
    if (CANCEL_KEYS.includes(e.code) && exitListener) {
        exitListener(e);
        e.preventDefault();
        return;
    }
    if (!op) return;
    let $current = $focused;
    $current.removeClass("active");
    while (true) {
        const $target = op === "next" ? $current.next(".focusable") : $current.prev(".focusable");
        if (!$target.length) break;
        if ($target.is(":visible")) {
            $target.trigger("focus");
            break;
        }
        $current = $target;
    }
});
$(document).on("keyup", function (e) {
    // Handle Ctrl key release to stop skipping
    if (e.key === "Control" && window.skipping) {
        // Ctrl key
        window.skipping = false;
        // Notify systems that skip mode has ended so they can resume behaviors
        try {
            document.dispatchEvent(new CustomEvent("SkipModeEnded", { bubbles: true }));
        } catch {}
    }

    if (CONFIRM_KEYS.includes(e.code)) {
        const $focused = $(".focusable:focus");
        if ($focused.length) {
            $focused.removeClass("active");
            if (confirmListener) {
                confirmListener(e, $focused);
            } else {
                $focused.trigger("click");
            }
        }
    }
});
$(document).on("contextmenu", function (e) {
    if (exitListener && !overrideRightKeys) {
        exitListener(e);
        e.preventDefault();
    }
});
