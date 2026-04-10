export function getProgress(): number[] {
  const p = localStorage.getItem("progress");
  if (p) return JSON.parse(p);
  const init = new Array(16).fill(0);
  localStorage.setItem("progress", JSON.stringify(init));
  return init;
}

export function incProgress(index: number): void {
  const p = getProgress();
  p[index] = (p[index] || 0) + 1;
  localStorage.setItem("progress", JSON.stringify(p));
}
