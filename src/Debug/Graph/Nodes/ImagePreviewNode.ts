import { GenericEventNode } from "./BaseNodes";

// -- Image Preview Base and Nodes --
export abstract class ImagePreviewNode extends GenericEventNode {
    _img: HTMLImageElement | null = null;
    _lastUrl: string | null = null;

    constructor(type: string) {
        super(type);
        this.size = [220, 80];
    }

    abstract getImageUrl(): string | null;

    onDrawForeground(ctx: CanvasRenderingContext2D) {
        if (this.flags.collapsed) return;

        const url = this.getImageUrl();
        if (!url) {
            this._img = null;
            this._lastUrl = null;
            return;
        }

        if (url !== this._lastUrl) {
            this._img = new Image();
            this._img.src = url;
            this._lastUrl = url;
        }

        if (this._img && this._img.complete && this._img.naturalWidth > 0) {
            // Draw thumbnail in top-right
            const maxHeight = 45;
            const ratio = this._img.width / this._img.height;
            const thumbW = maxHeight * ratio;
            const thumbH = maxHeight;

            const padding = 5;
            const x = this.size[0] - thumbW - padding;
            const y = -50;

            ctx.save();

            ctx.fillStyle = "rgba(0,0,0,0)";

            ctx.fillRect(x, y, thumbW, thumbH);
            ctx.drawImage(this._img, x, y, thumbW, thumbH);

            ctx.restore();
        }
    }
}
