import $ from "jquery";
import { LGraph, LGraphCanvas } from "litegraph.js";
import { buildEventGraph } from "./EventGraphLayout";
import { registerEventNodes } from "./Nodes";

// Ensure CSS is injected or loaded.
// We will inject a basic style tag for the overlay if not present.
const overlayStyle = `
<style id="event-graph-style">
    #event-graph-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 9999;
        background: transparent;
        display: none;
    }
    #event-graph-canvas {
        width: 100%;
        height: 100%;
        opacity: 0.95;
    }
    #event-graph-toolbar {
        position: absolute;
        top: 10px;
        right: 20px;
        z-index: 10000;
        display: flex;
        gap: 10px;
    }
    .graph-btn {
        background: #444;
        color: white;
        border: 1px solid #666;
        padding: 5px 10px;
        cursor: pointer;
        font-family: sans-serif;
    }
    .graph-btn:hover { background: #555; }
</style>
`;

export class EventGraphEditor {
    private static instance: EventGraphEditor;
    private container!: HTMLElement;
    private canvasElement!: HTMLCanvasElement;
    private graph!: LGraph;
    private canvas!: LGraphCanvas;
    private isVisible: boolean = false;

    private constructor() {
        this.createOverlay();
        this.initializeLiteGraph();
    }

    public static getInstance(): EventGraphEditor {
        if (!EventGraphEditor.instance) {
            EventGraphEditor.instance = new EventGraphEditor();
        }
        return EventGraphEditor.instance;
    }

    private createOverlay() {
        if (!document.getElementById("event-graph-style")) {
            $("head").append(overlayStyle);
        }

        const html = `
            <div id="event-graph-overlay">
                <canvas id="event-graph-canvas"></canvas>
                <div id="event-graph-toolbar">
                    <button id="btn-refresh-graph" class="graph-btn">Refresh</button>
                </div>
            </div>
        `;
        $("body").append(html);

        this.container = document.getElementById("event-graph-overlay")!;
        this.canvasElement = document.getElementById("event-graph-canvas") as HTMLCanvasElement;

        $("#btn-close-graph").on("click", () => this.toggle());
        $("#btn-refresh-graph").on("click", () => this.refresh());

        // Resize handler
        window.addEventListener("resize", () => {
            if (this.isVisible) {
                this.resize();
            }
        });
    }

    private initializeLiteGraph() {
        registerEventNodes();

        this.graph = new LGraph();
        this.canvas = new LGraphCanvas(this.canvasElement, this.graph);
        this.canvas.allow_dragcanvas = true;
        this.canvas.allow_dragnodes = true;
        this.canvas.zoom_modify_alpha = false;

        // Settings
        this.graph.start();
        this.resize();
    }

    private resize() {
        this.canvasElement.width = window.innerWidth;
        this.canvasElement.height = window.innerHeight;
        this.canvas.resize();
    }

    public toggle() {
        this.isVisible = !this.isVisible;
        if (this.isVisible) {
            $(this.container).fadeIn(200);
            this.resize();
            // Optional: Auto-refresh on open if empty or needed
            if ((this.graph as any)._nodes.length === 0) {
                this.refresh();
            }
        } else {
            $(this.container).fadeOut(200);
        }
    }

    public refresh() {
        // Read from global ScreenplayContext (loaded by Events.ts)
        const eventsMap = {
            events: window.ScreenplayContext?.blocks || [],
            textPool: window.ScreenplayContext?.textPool || [],
        };

        if (eventsMap.events.length === 0) {
            console.warn("No events loaded to visualize.");
            return;
        }

        console.log("Refrehsing Event Graph...", eventsMap);
        buildEventGraph(this.graph, eventsMap);
        this.canvas.setDirty(true, true);
    }
}

// Global initialization
export function initEventGraphOverlay() {
    const editor = EventGraphEditor.getInstance();

    // Bind F3 key
    document.addEventListener("keydown", e => {
        if (e.code === "F3") {
            e.preventDefault();
            editor.toggle();
        }
    });

    console.log("Event Graph Overlay Initialized. Press F3 to toggle.");
}
