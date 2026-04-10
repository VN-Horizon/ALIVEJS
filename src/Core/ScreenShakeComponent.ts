let rafId: number | null = null;
let shakeStartTime = 0;
let shakeEndTime = 0;
let shakeDuration = 0;
let shakeStrength = 0;

function computeBaseScale(container: HTMLElement): number {
  const baseWidth = 640;
  const baseHeight = 480;
  const parent = container.parentElement;
  const targetWidth = parent ? parent.clientWidth : window.innerWidth;
  const targetHeight = parent ? parent.clientHeight : window.innerHeight;
  const scaleX = targetWidth / baseWidth;
  const scaleY = targetHeight / baseHeight;
  return Math.min(scaleX, scaleY);
}

function applyTransform(container: HTMLElement, offsetX: number, offsetY: number): void {
  const scale = computeBaseScale(container);
  container.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

function stopLoopAndReset(container: HTMLElement): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  shakeStartTime = 0;
  shakeEndTime = 0;
  shakeDuration = 0;
  shakeStrength = 0;
  applyTransform(container, 0, 0);
}

function step(): void {
  const container = window.getEngine()?.getContainer();
  if (!container) {
    rafId = null;
    return;
  }

  const now = performance.now();
  if (shakeEndTime <= 0 || now >= shakeEndTime) {
    stopLoopAndReset(container);
    return;
  }

  const elapsed = now - shakeStartTime;
  const progress = Math.min(1, Math.max(0, elapsed / shakeDuration));
  const damping = Math.pow(1 - progress, 2);
  const range = shakeStrength * damping;

  const offsetX = (Math.random() * 2 - 1) * range;
  const offsetY = (Math.random() * 2 - 1) * range;
  applyTransform(container, offsetX, offsetY);

  rafId = requestAnimationFrame(step);
}

export function shakeScreen(durationMs: number, strength?: number): void {
  const container = window.getEngine()?.getContainer();
  if (!container) return;

  const duration = Math.max(0, durationMs);
  if (duration <= 0) {
    stopLoopAndReset(container);
    return;
  }

  shakeStartTime = performance.now();
  shakeDuration = duration;
  shakeEndTime = shakeStartTime + duration;
  shakeStrength = Math.max(0, strength ?? Math.min(20, Math.max(6, duration / 60)));

  if (rafId === null) {
    rafId = requestAnimationFrame(step);
  }
}
