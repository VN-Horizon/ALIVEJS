import { LGraphNode } from "litegraph.js";
import { BaseEventNode } from "./BaseNodes";

// PlayDialog
export class PlayDialogNode extends BaseEventNode {
    static title = "Play Dialog";
    constructor() {
        super();
        this.title = "Play Dialog";
        this.properties = { text: "" };
        this.addWidget(
            "text",
            "Text",
            "",
            v => {
                this.properties.text = v;
            },
            { multiline: true },
        );
        this.size = [300, 60];
    }
}

// ShowDecision (Branching)
export class BranchOptionsNode extends LGraphNode {
    static title = "Branch Options";
    constructor() {
        super();
        this.title = "Branch Options";
        this.addInput("Action", "Action");
        // Outputs are dynamic based on choices, but we start with none or generic
        // We will add them dynamically during graph build
    }

    setChoices(choices: string[]) {
        // Clear existing outputs if needed, but for now assuming clean create
        choices.forEach((choice, index) => {
            this.addOutput(`Opt ${index}: ${choice.substring(0, 10)}...`, "Action");
        });
    }
}
