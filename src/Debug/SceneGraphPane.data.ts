import { ACTIVE_NODE_COLOR, CHOICE_NODE_COLOR, DEFAULT_LINK_COLOR, DEFAULT_NODE_COLOR, END_NODE_COLOR, END_NODE_ID, FUNCTION_NODE_COLOR } from "./SceneGraphPane.constants";
import type { SceneGraphBlock, SceneGraphContext, SceneGraphLink, SceneGraphNode } from "./SceneGraphPane.types";

export function buildSceneGraphData(): { nodes: SceneGraphNode[]; links: SceneGraphLink[] } {
    const screenplayContext = getScreenplayContext();
    if (!screenplayContext || !screenplayContext.blocks) {
        return { nodes: [], links: [] };
    }

    const links: SceneGraphLink[] = [];
    const nodeMap = new Map<number, SceneGraphNode>();
    const outgoingLinks = new Map<number, SceneGraphLink[]>();
    const incomingLinks = new Map<number, number[]>();
    const endSourceIds = new Set<number>();

    screenplayContext.blocks.forEach((event, index) => {
        const evId = event.evId;
        const nodeColor = getNodeColor(event, index, screenplayContext.currentBlockIndex);

        nodeMap.set(evId, {
            id: evId,
            index,
            label: `${evId}`,
            color: nodeColor,
            radius: event.hasChoices ? 12 : 10,
        });
    });

    nodeMap.set(END_NODE_ID, {
        id: END_NODE_ID,
        label: "END",
        color: END_NODE_COLOR,
        radius: 16,
    });

    const registerLink = (link: SceneGraphLink): void => {
        links.push(link);

        const sourceId = getNodeId(link.source);
        const targetId = getNodeId(link.target);
        if (sourceId === undefined || targetId === undefined) {
            return;
        }

        if (!outgoingLinks.has(sourceId)) {
            outgoingLinks.set(sourceId, []);
        }
        outgoingLinks.get(sourceId)!.push(link);

        if (!incomingLinks.has(targetId)) {
            incomingLinks.set(targetId, []);
        }
        incomingLinks.get(targetId)!.push(sourceId);

        if (targetId === END_NODE_ID) {
            endSourceIds.add(sourceId);
        }
    };

    screenplayContext.blocks.forEach(event => {
        const sourceId = event.evId;
        if (event.returnValues && event.returnValues.length > 0) {
            event.returnValues.forEach(targetEvId => {
                if (!nodeMap.has(targetEvId)) {
                    return;
                }

                registerLink({
                    source: sourceId,
                    target: targetEvId,
                    color: DEFAULT_LINK_COLOR,
                });
            });
        }

        if (event.conditionalReturns && event.conditionalReturns.length > 0) {
            event.conditionalReturns.forEach(conditionalReturn => {
                const targetEvId = conditionalReturn.returnValue;
                if (!nodeMap.has(targetEvId)) {
                    return;
                }

                registerLink({
                    source: sourceId,
                    target: targetEvId,
                    color: DEFAULT_LINK_COLOR,
                    label: conditionalReturn.passedEvIds.join(", "),
                    isConditional: true,
                });
            });
        }
    });

    const rootCache = new Map<number, number>();
    const pathColors = [
        "#ff6b6b", "#4ecdc4", "#f7b731",
        "#5f27cd", "#86d300ff", "#ff9ff3", "#fe57fbff",
        "#b0e4efff", "#ff6348", "#1dd1a1",
        "#c44569", "#dff800ff", "#778beb", "#e77f67",
    ];

    const findRootNode = (nodeId: number, visited: Set<number> = new Set()): number => {
        if (rootCache.has(nodeId)) {
            return rootCache.get(nodeId)!;
        }
        if (visited.has(nodeId)) {
            return nodeId;
        }

        visited.add(nodeId);
        const parents = incomingLinks.get(nodeId) || [];
        if (parents.length === 0) {
            rootCache.set(nodeId, nodeId);
            return nodeId;
        }

        const root = findRootNode(parents[0], visited);
        rootCache.set(nodeId, root);
        return root;
    };

    const colorPath = (nodeId: number, color: string, visited: Set<number>): void => {
        if (visited.has(nodeId)) {
            return;
        }
        visited.add(nodeId);

        const outgoing = outgoingLinks.get(nodeId) || [];
        for (const link of outgoing) {
            const targetId = getNodeId(link.target);
            if (targetId === undefined) {
                continue;
            }

            link.color = color;
            if (targetId !== END_NODE_ID) {
                colorPath(targetId, color, visited);
            }
        }
    };

    const pathColorMap = new Map<number, string>();
    let colorIndex = 0;

    endSourceIds.forEach(nodeId => {
        const rootNode = findRootNode(nodeId);
        if (!pathColorMap.has(rootNode)) {
            pathColorMap.set(rootNode, pathColors[colorIndex % pathColors.length]);
            colorIndex++;
        }

        const pathColor = pathColorMap.get(rootNode)!;
        colorPath(rootNode, pathColor, new Set());
    });

    return { nodes: Array.from(nodeMap.values()), links };
}

export function getScreenplayContext(): SceneGraphContext | null {
    const screenplayContext = window.ScreenplayContext as SceneGraphContext | undefined;
    return screenplayContext ?? null;
}

function getNodeColor(event: SceneGraphBlock, index: number, currentBlockIndex: number): string {
    if (index === currentBlockIndex) {
        return ACTIVE_NODE_COLOR;
    }
    if (event.hasChoices) {
        return CHOICE_NODE_COLOR;
    }
    if (hasRenderableFunctionValue(event.evFunc)) {
        return FUNCTION_NODE_COLOR;
    }
    return DEFAULT_NODE_COLOR;
}

function hasRenderableFunctionValue(value: unknown): boolean {
    if (typeof value === "string" || Array.isArray(value)) {
        return value.length > 0;
    }
    return false;
}

function getNodeId(endpoint: number | SceneGraphNode | string | undefined): number | undefined {
    if (typeof endpoint === "number") {
        return endpoint;
    }
    if (typeof endpoint === "object" && endpoint !== null) {
        return endpoint.id;
    }
    return undefined;
}
