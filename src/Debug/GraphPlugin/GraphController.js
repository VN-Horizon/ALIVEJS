import { GraphView } from './GraphView.js';

export class GraphController {
    constructor(doc, config) {
        // Models - create value object if not provided
        if (!config.value) {
            this.value = {
                rawValue: config.params?.value || { nodes: [], links: [] },
                emitter: {
                    on: () => {},
                }
            };
        } else {
            this.value = config.value;
        }
        
        this.viewProps = config.viewProps;
        
        // Create view
        this.view = new GraphView(doc, {
            value: this.value,
            viewProps: this.viewProps,
            width: config.width,
            height: config.height,
        });
    }
    
    dispose() {
        if (this.view && this.view.dispose) {
            this.view.dispose();
        }
    }
}
