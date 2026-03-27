import { LGraphNode } from "litegraph.js";

// -- Base Event Node --
export class BaseEventNode extends LGraphNode {
    constructor() {
        super();
        this.addInput("Action", "Action");
        this.addOutput("Action", "Action");
    }

    onExecute() {
        // Pass execution flow
        this.triggerSlot(0, null);
    }
}

// Generic Event Node (for everything else for now)
export class GenericEventNode extends BaseEventNode {
    constructor(type: string) {
        super();
        this.title = type;
        this.properties = { params: [], stringParams: [] };
    }

    updateWidgets() {}
}

// Start Node for Subgraphs
export class EventStartNode extends LGraphNode {
    static title = "Event Start";
    constructor() {
        super();
        this.title = "Event Start";
        this.addOutput("Start", "Action");
    }
}

// End Node
export class EventEndNode extends LGraphNode {
    static title = "Event End";
    constructor() {
        super();
        this.title = "Event End";
        this.addInput("End", "Action");
    }
}
