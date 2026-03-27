import { ImagePreviewNode } from "./ImagePreviewNode";

export class SetCharaImgNode extends ImagePreviewNode {
    static title = "SetCharaImg";
    constructor() {
        super("SetCharaImg");
        this.addWidget("text", "Category", "", v => {
            this.ensureStringParams(2);
            this.properties.stringParams[0] = v;
        });
        this.addWidget("text", "Name", "", v => {
            this.ensureStringParams(2);
            this.properties.stringParams[1] = v;
        });
    }

    ensureStringParams(count: number) {
        if (!this.properties.stringParams) this.properties.stringParams = [];
        while (this.properties.stringParams.length < count) this.properties.stringParams.push("");
    }

    updateWidgets() {
        if (this.properties.stringParams) {
            if ((this as any).widgets && (this as any).widgets[0])
                (this as any).widgets[0].value = this.properties.stringParams[0] || "";
            if ((this as any).widgets && (this as any).widgets[1])
                (this as any).widgets[1].value = this.properties.stringParams[1] || "";
        }
    }

    getImageUrl(): string | null {
        // [category, name]
        const p = this.properties.stringParams;
        if (!p || p.length < 2) return null;
        if (p[0] === "0" || p[1] === "0") return null;
        return `/assets/scenes/Portraits/${p[0]}/${p[1]}.webp`;
    }
}
