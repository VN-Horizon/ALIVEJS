export type WipeDirection = "bottomToTop" | "topToBottom" | "leftToRight" | "rightToLeft";

const FEATHER_WIDTH = 0.2;
const STOPS = 64;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function contentAlpha(progress: number, coord: number): number {
  const leadingEdge = 1 - smoothstep(progress, progress + FEATHER_WIDTH, coord);
  const trailingEdge = smoothstep(
    progress - 1 - FEATHER_WIDTH,
    progress - 1,
    coord
  );
  return leadingEdge * trailingEdge;
}

function sweep(
  overlay: HTMLElement,
  direction: WipeDirection,
  durationMs: number,
  maskAlpha: (progress: number, coord: number) => number
): Promise<void> {
  const vertical = direction === "topToBottom" || direction === "bottomToTop";
  const gradientAxis = vertical ? "to bottom" : "to right";
  const startProgress = -FEATHER_WIDTH;

  return new Promise((resolve) => {
    const startTime = performance.now();

    const frame = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      const progress = startProgress + (1 - startProgress) * t;

      const stops: string[] = [];
      for (let i = 0; i <= STOPS; i++) {
        const pos = i / STOPS;
        const coord =
          direction === "bottomToTop" || direction === "rightToLeft" ? 1 - pos : pos;
        const alpha = maskAlpha(progress, coord);
        stops.push(`rgba(0,0,0,${alpha.toFixed(3)}) ${(pos * 100).toFixed(2)}%`);
      }
      const mask = `linear-gradient(${gradientAxis}, ${stops.join(", ")})`;
      overlay.style.maskImage = mask;
      overlay.style.webkitMaskImage = mask;

      if (t >= 1) {
        resolve();
        return;
      }
      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  });
}

export async function runWipeOutIn(
  direction: WipeDirection,
  durationMs: number,
  between?: () => Promise<void>
): Promise<void> {
  if (durationMs <= 0) return;

  const container = document.getElementById("gameContainer");
  if (!container) return;

  const overlay = document.createElement("div");
  overlay.id = "wipe-overlay";
  container.appendChild(overlay);

  await sweep(overlay, direction, durationMs, contentAlpha);
  if (between) {
    await between();
  }
  await sweep(overlay, direction, durationMs, (progress, coord) => 1 - contentAlpha(progress, coord));

  overlay.remove();
}
