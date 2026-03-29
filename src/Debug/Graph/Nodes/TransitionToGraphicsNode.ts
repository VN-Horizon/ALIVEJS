import { ImagePreviewNode } from "./ImagePreviewNode";

export class TransitionToGraphicsNode extends ImagePreviewNode {
    static title = "TransitionToGraphics";
    constructor() {
        super("TransitionToGraphics");
        // Param 0,1 are unknown/transition details, 2 is Cat, 3 is Name
        this.addWidget("text", "P1", "", v => {
            this.ensureStringParams(4);
            this.properties.stringParams[0] = v;
        });
        this.addWidget("text", "P2", "", v => {
            this.ensureStringParams(4);
            this.properties.stringParams[1] = v;
        });
        this.addWidget("text", "Category", "", v => {
            this.ensureStringParams(4);
            this.properties.stringParams[2] = v;
        });
        this.addWidget("text", "Name", "", v => {
            this.ensureStringParams(4);
            this.properties.stringParams[3] = v;
        });
        this.size = [240, 140]; // Taller for widgets
    }

    ensureStringParams(count: number) {
        if (!this.properties.stringParams) this.properties.stringParams = [];
        while (this.properties.stringParams.length < count) this.properties.stringParams.push("");
    }

    updateWidgets() {
        if (this.properties.stringParams) {
            for (let i = 0; i < 4; i++) {
                if ((this as any).widgets && (this as any).widgets[i])
                    (this as any).widgets[i].value = this.properties.stringParams[i] || "";
            }
        }
    }

    getImageUrl(): string | null {
        // [?, ?, category, name]
        const p = this.properties.stringParams;
        if (!p || p.length < 4) return null;
        if (p[2] === "0" || p[3] === "0") return "/assets/scenes/CG/BLACK/BLACK.avif";
        return `/assets/scenes/BG/${p[2]}/${p[3]}.avif`;
    }
}

export class TransitionToGraphicsFadeNode extends ImagePreviewNode {
    static title = "TransitionToGraphicsFade";
    constructor() {
        super("TransitionToGraphicsFade");
        this.addWidget("text", "P1", "", v => {
            this.ensureStringParams(4);
            this.properties.stringParams[0] = v;
        });
        this.addWidget("text", "P2", "", v => {
            this.ensureStringParams(4);
            this.properties.stringParams[1] = v;
        });
        this.addWidget("text", "Category", "", v => {
            this.ensureStringParams(4);
            this.properties.stringParams[2] = v;
        });
        this.addWidget("text", "Name", "", v => {
            this.ensureStringParams(4);
            this.properties.stringParams[3] = v;
        });
        this.size = [240, 140];
    }

    ensureStringParams(count: number) {
        if (!this.properties.stringParams) this.properties.stringParams = [];
        while (this.properties.stringParams.length < count) this.properties.stringParams.push("");
    }

    updateWidgets() {
        if (this.properties.stringParams) {
            for (let i = 0; i < 4; i++) {
                if ((this as any).widgets && (this as any).widgets[i])
                    (this as any).widgets[i].value = this.properties.stringParams[i] || "";
            }
        }
    }

    getImageUrl(): string | null {
        // Same as TransitionToGraphics
        const p = this.properties.stringParams;
        if (!p || p.length < 4) return null;
        if (p[2] === "0" || p[3] === "0") return "/assets/scenes/CG/BLACK/BLACK.avif";
        return `/assets/scenes/BG/${p[2]}/${p[3]}.avif`;
    }
}
