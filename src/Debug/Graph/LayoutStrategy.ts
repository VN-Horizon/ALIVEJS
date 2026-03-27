import { LGraph, LGraphNode } from "litegraph.js";
import { EventBlock } from "@/Core/Events";

export function layoutMainGraph(graph: LGraph, nodeMap: Map<number, LGraphNode>, events: EventBlock[]) {
    const visitedNodeIds = new Set<number>();

    // Layout state
    let currentY = 100;
    const START_X = 100;
    const X_STEP = 230; // Increased horizontal spacing for better readability
    const Y_STEP = 130;

    // Recursive placement function
    function placeNode(node: LGraphNode, x: number, y: number) {
        if (!node || visitedNodeIds.has(node.id)) return;

        // Mark as visited
        visitedNodeIds.add(node.id);

        // Set position
        node.pos = [x, y];

        // Traverse Children via Outputs
        if (node.outputs) {
            node.outputs.forEach((output, slotIndex) => {
                // Check if this output has any links
                if (!output.links || output.links.length === 0) return;

                // Follow each link
                output.links.forEach(linkId => {
                    const link = graph.links[linkId];
                    if (!link) return;

                    const targetNode = graph.getNodeById(link.target_id);
                    // Ensure we don't revisit nodes (prevents infinite loops in cyclic graphs)
                    if (targetNode && !visitedNodeIds.has(targetNode.id)) {
                        let nextX = x + X_STEP;
                        let nextY = y;

                        // Layout Logic:
                        // Slot 0 (Main flow) attempts to continue on the same Y-level (straight line).
                        // Slot > 0 (Branches) must branch down to a new Y-level.

                        if (slotIndex > 0) {
                            // Force a new "line" for branches
                            nextY = currentY + Y_STEP;
                        }

                        placeNode(targetNode, nextX, nextY);
                    }
                });
            });
        }
    }

    // 1. Identify "Root" Nodes
    // Roots are nodes that have NO incoming links (in-degree == 0).
    const allNodes = Array.from(nodeMap.values());
    const roots = allNodes.filter(node => {
        // If no inputs array, it's definitely a root (or isolated)
        if (!node.inputs || node.inputs.length === 0) return true;

        // Check if all inputs are disconnected (link is null or undefined or 0-ish check)
        // In LiteGraph, unlinked inputs usually have .link property as null
        return node.inputs.every(input => input.link === null || input.link === undefined);
    });

    // Sort roots by Event ID to ensure deterministic layout order
    roots.sort((a, b) => {
        const idA = a.properties?.evId || 0;
        const idB = b.properties?.evId || 0;
        return idA - idB;
    });

    // Fallback: If no roots found (e.g., a completely circular graph), pick the first event as start.
    if (roots.length === 0 && events.length > 0) {
        const fallbackNode = nodeMap.get(events[0].evId);
        if (fallbackNode) roots.push(fallbackNode);
    }

    // 2. Place all Root trees
    roots.forEach(root => {
        placeNode(root, START_X, currentY);
        // Add spacing between disjoint trees
        currentY += Y_STEP * 2;
    });

    // 3. Cleanup: Place any remaining unreachable/cyclic nodes
    // (Nodes that were part of a cycle which had no external entry point and weren't picked by fallback)
    allNodes.forEach(node => {
        if (!visitedNodeIds.has(node.id)) {
            placeNode(node, START_X, currentY);
            currentY += Y_STEP;
        }
    });
}
