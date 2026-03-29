import { ImagePreviewNode } from "./ImagePreviewNode";

export class SetBgImgNode extends ImagePreviewNode {
    static title = "SetBgImg";
    constructor() {
        super("SetBgImg");
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
        return `/assets/scenes/BG/${p[0]}/${p[1]}.avif`;
    }
}

export class ShowCgNode extends ImagePreviewNode {
    static title = "ShowCg";
    constructor() {
        super("ShowCg");
        this.addWidget("text", "CG Name", "", v => {
            this.ensureStringParams(1);
            this.properties.stringParams[0] = v;
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
        }
    }

    getImageUrl(): string | null {
        const p = this.properties.stringParams;
        if (!p || p.length < 1) return null;
        const name = p[0];
        return `/assets/scenes/CG/${name.toUpperCase()}/${name.toUpperCase()}.avif`;
    }
}
