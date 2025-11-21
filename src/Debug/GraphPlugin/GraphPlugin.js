import { GraphController } from './GraphController.js';

export const GraphBladePlugin = {
    id: 'graph',
    type: 'blade',
    core: {}, // Required for Tweakpane compatibility
    
    accept(params) {
        // Accept when view is set to 'graph'
        const view = params.view;
        
        if (view !== 'graph') {
            return null;
        }
        
        return { params };
    },
    
    controller(args) {
        return new GraphController(args.document, {
            value: args.value || { rawValue: args.params.value || { nodes: [], links: [] } },
            viewProps: args.viewProps,
            width: args.params.width || 400,
            height: args.params.height || 300,
        });
    },
    
    api(args) {
        if (args.controller instanceof GraphController) {
            return new GraphBladeApi(args.controller);
        }
        return null;
    }
};

class GraphBladeApi {
    constructor(controller) {
        this.controller_ = controller;
    }
    
    get controller() {
        return this.controller_;
    }
    
    get value() {
        return this.controller_.value;
    }
    
    updateGraph(nodes, links) {
        this.controller_.value.rawValue = { nodes, links };
    }
}

// Bundle for easy registration
export const GraphPluginBundle = {
    id: 'graph',
    plugins: [GraphBladePlugin],
    css: `
        .tp-graphv {
            position: relative;
            overflow: hidden;
        }
        .tp-graphv svg {
            border-radius: 2px;
        }
        .tp-graphv circle {
            cursor: pointer;
        }
        .tp-graphv circle:hover {
            stroke: #fff;
            stroke-width: 2px;
        }
    `
};
