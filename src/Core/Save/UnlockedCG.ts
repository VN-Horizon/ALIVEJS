export function getUnlockedCG(): string[] {
    const p = localStorage.getItem("cgs");
    if (p) return JSON.parse(p);
    const init = [] as string[];
    localStorage.setItem("cgs", JSON.stringify(init));
    return init;
}

export function addUnlockedCG(cg: string): void {
    const p = getUnlockedCG();
    if (!p.includes(cg)) {
        p.push(cg);
        localStorage.setItem("cgs", JSON.stringify(p));
    }
}
