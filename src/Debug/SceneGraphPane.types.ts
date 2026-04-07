import type { EventMapping, ScreenplayContextState } from "@/types/events";
import * as d3 from "d3";

export type SceneGraphBlock = EventMapping & {
    hasChoices?: boolean;
};

export type SceneGraphContext = Omit<ScreenplayContextState, "blocks"> & {
    blocks: SceneGraphBlock[];
};

export interface SceneGraphNode extends d3.SimulationNodeDatum {
    id: number;
    label: string;
    color: string;
    radius: number;
}

export type SceneGraphLink = d3.SimulationLinkDatum<SceneGraphNode> & {
    source: number | SceneGraphNode;
    target: number | SceneGraphNode;
    color: string;
    label?: string;
    isConditional?: boolean;
};
