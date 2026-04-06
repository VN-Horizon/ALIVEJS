type AutoContinueTimeoutHandler = () => void;
type AutoContinuePauseHandler = (isPaused: boolean) => void;

let timeoutId: ReturnType<typeof setTimeout> | null = null;
let timeoutHandler: AutoContinueTimeoutHandler | null = null;
let pauseHandler: AutoContinuePauseHandler | null = null;
let isPaused = false;

function setPaused(paused: boolean): void {
    if (isPaused === paused) return;
    isPaused = paused;
    pauseHandler?.(paused);
}

export function setAutoContinueTimeoutHandler(handler: AutoContinueTimeoutHandler | null): void {
    timeoutHandler = handler;
}

export function setAutoContinuePauseHandler(handler: AutoContinuePauseHandler | null): void {
    pauseHandler = handler;
}

export function isAutoContinuePaused(): boolean {
    return isPaused;
}

export function clearAutoContinueTimer(): void {
    if (timeoutId === null) {
        setPaused(false);
        return;
    }

    clearTimeout(timeoutId);
    timeoutId = null;
    setPaused(false);
}

export function scheduleAutoContinueTimer(delayMs: number): void {
    clearAutoContinueTimer();
    setPaused(true);
    timeoutId = setTimeout(() => {
        timeoutId = null;
        setPaused(false);
        timeoutHandler?.();
    }, Math.max(0, delayMs));
}

export function skipAutoContinueTimer(): boolean {
    if (timeoutId === null) return false;
    clearAutoContinueTimer();
    timeoutHandler?.();
    return true;
}