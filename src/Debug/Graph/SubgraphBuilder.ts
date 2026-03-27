import { LGraph, LiteGraph } from "litegraph.js";
import { EventBlock, Instruction, ResolvedInstruction, resolveStrings } from "@/Core/Events";
import { INSTRUCTION_NODE_MAP } from "./Nodes";

// Helper to resolve instruction data statically (mocking context if needed, but we have textPool)
function getResolvedInstruction(instruction: Instruction, textPool: string[]): ResolvedInstruction {
    return {
        type: instruction.type,
        params: instruction.params,
        stringParams: resolveStrings(instruction, textPool),
    };
}

export function buildInternalSubgraph(graph: LGraph, block: EventBlock, textPool: string[]) {
    // Add Input Node
    const inputNode = LiteGraph.createNode("graph/input");
    inputNode.setProperty("name", "In");
    inputNode.setProperty("type", "Action");
    graph.add(inputNode);
    inputNode.pos = [50, 200];

    let previousNode = inputNode;
    let xPos = 250;
    let yPos = 200;

    block.instructions.forEach(instr => {
        const type = instr.type;
        const nodeType = INSTRUCTION_NODE_MAP[type] || "Events/PlayDialog"; // Fallback? Or generic
        let node = LiteGraph.createNode(nodeType);

        if (!node) {
            console.warn("Unknown node type:", type);
            return;
        }

        const resolved = getResolvedInstruction(instr, textPool);

        // Populate properties for GenericEventNode and subclasses
        if (node.properties) {
            node.properties.params = resolved.params;
            node.properties.stringParams = resolved.stringParams;
        }

        // Update widgets if the node supports it
        if ((node as any).updateWidgets) {
            (node as any).updateWidgets();
        }

        if (type === "PlayDialog") {
            // Set text widget
            const text = resolved.stringParams[0] || "";
            // Simple parsing to remove [name] part if standard format
            if ((node as any).widgets && (node as any).widgets.length > 0) {
                (node as any).widgets[0].value = text;
            }
        } else if (type === "ShowDecision") {
            const choices = resolved.stringParams; // Filtered inside? logic usually filters empty
            if ((node as any).setChoices) (node as any).setChoices(choices);
        }

        graph.add(node);
        node.pos = [xPos, yPos];
        xPos += node.size[0] + 20;
        if (xPos > 1500) {
            xPos = 250;
            yPos += 200;
        }

        // Connect
        // If Type is ShowDecision, it branches INSIDE the node ?
        // Actually, ShowDecision node should output to the Subgraph Outputs.
        if (type === "ShowDecision") {
            // Connect previous to this
            previousNode.connect(0, node, 0);

            // Connect this to Subgraph Outputs
            // The Subgraph needs mapped Output nodes
            // create 'graph/output' nodes for each choice
            if (node.outputs) {
                node.outputs.forEach((output, idx) => {
                    const outputNode = LiteGraph.createNode("graph/output");
                    outputNode.setProperty("name", `Branch ${idx}`);
                    outputNode.setProperty("type", "Action");
                    graph.add(outputNode);
                    outputNode.pos = [xPos, yPos - 100 + idx * 100];

                    node.connect(idx, outputNode, 0);
                });
            }
            // End of chain for this block's internal logic
            // previousNode = null;
            previousNode = undefined as any;
        } else {
            previousNode.connect(0, node, 0);
            previousNode = node;
        }
    });

    // If chain didn't end with Branching, connect to single Output
    if (previousNode) {
        const outputNode = LiteGraph.createNode("graph/output");
        outputNode.setProperty("name", "Out");
        outputNode.setProperty("type", "Action");
        graph.add(outputNode);
        outputNode.pos = [xPos, yPos];
        previousNode.connect(0, outputNode, 0);
    }
}
