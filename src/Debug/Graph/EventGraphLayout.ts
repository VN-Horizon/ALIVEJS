import { LGraph, LGraphNode, LiteGraph } from "litegraph.js";
import { EventBlock, resolveStrings } from "../../Core/Events";
import { layoutMainGraph } from "./LayoutStrategy";
import { buildInternalSubgraph } from "./SubgraphBuilder";

export function buildEventGraph(mainGraph: LGraph, eventsMap: { events: EventBlock[]; textPool: string[] }) {
    mainGraph.clear();

    const { events, textPool } = eventsMap;
    const evIdToSubgraphNode = new Map<number, LGraphNode>();
    LiteGraph.MAX_NUMBER_OF_NODES = 10000;

    // 1. Create Subgraphs for each Block
    events.forEach(block => {
        const subgraphNode = LiteGraph.createNode("graph/subgraph");
        subgraphNode.title = `Block ${block.evId}`;
        subgraphNode.properties = { evId: block.evId }; // Store ID
        subgraphNode.onDrawBackground = function () {};

        // Setup Subgraph Interface
        subgraphNode.addInput("In", "Action");

        // Determine outputs based on block return values
        if (block.returnValues && block.returnValues.length > 0) {
            // Check if the block contains "ShowDecision"
            const hasDecision = block.instructions.some(i => i.type === "ShowDecision");
            if (hasDecision) {
                const resolved = resolveStrings(block.instructions.find(i => i.type === "ShowDecision")!, textPool);
                // It likely has multiple return values matching choices
                resolved.forEach(val => {
                    subgraphNode.addOutput(val, "Action");
                });
            } else {
                subgraphNode.addOutput("Out", "Action");
            }
        } else {
            // End of line
            subgraphNode.addOutput("End", "Action");
        }

        mainGraph.add(subgraphNode);
        evIdToSubgraphNode.set(block.evId, subgraphNode);

        // 2. Build Internal Graph for this Block
        // Lazy Load: Store data and hook onDblClick
        (subgraphNode as any)._blockData = block;
        (subgraphNode as any)._textPool = textPool;

        // Hook DblClick to load on demand
        const originalDblClick = (subgraphNode as any).onDblClick;
        (subgraphNode as any).onDblClick = function (e: any, pos: any, graph: any) {
            if (!(this as any)._isPopulated) {
                const subgraph = (this as any).subgraph;
                if (subgraph) {
                    buildInternalSubgraph(subgraph, (this as any)._blockData, (this as any)._textPool);
                    (this as any)._isPopulated = true;
                    console.log(`Lazy loaded block ${(this as any).properties.evId}`);
                }
            }
            if (originalDblClick) {
                originalDblClick.call(this, e, pos, graph);
            }
        };
    });

    // 3. Connect Subgraphs in Main Graph
    events.forEach(block => {
        const sourceNode = evIdToSubgraphNode.get(block.evId);
        if (!sourceNode) return;

        if (block.returnValues && block.returnValues.length > 0) {
            block.returnValues.forEach((targetEvId, index) => {
                const targetNode = evIdToSubgraphNode.get(targetEvId);
                if (targetNode) {
                    // Safety check on slots
                    if (!sourceNode.outputs || sourceNode.outputs.length <= index) return;

                    let targetSlot = -1;
                    if (targetNode.inputs) {
                        for (let i = 0; i < targetNode.inputs.length; i++) {
                            if (targetNode.inputs[i].link === null || targetNode.inputs[i].link === undefined) {
                                targetSlot = i;
                                break;
                            }
                        }
                    }

                    if (targetSlot === -1) {
                        targetNode.addInput("In", "Action");
                        targetSlot = targetNode.inputs.length - 1;
                    }

                    sourceNode.connect(index, targetNode, targetSlot);
                } else if (targetEvId === 7090644) {
                    // END special ID
                    const endNode = LiteGraph.createNode("Events/End");
                    mainGraph.add(endNode);
                    // Position it later
                    if (sourceNode.outputs && sourceNode.outputs.length > index) {
                        sourceNode.connect(index, endNode, 0);
                    }
                }
            });
        }
    });

    // 4. Layout Main Graph
    layoutMainGraph(mainGraph, evIdToSubgraphNode, events);
}
