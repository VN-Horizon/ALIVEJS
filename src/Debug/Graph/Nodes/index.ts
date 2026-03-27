import { LiteGraph } from "litegraph.js";
import { SetBgImgNode, ShowCgNode } from "./BackgroundNodes";
import { EventEndNode, EventStartNode, GenericEventNode } from "./BaseNodes";
import { BranchOptionsNode, PlayDialogNode } from "./DialogNodes";
import { SetCharaImgNode } from "./SetCharaImgNode";
import { TransitionToGraphicsFadeNode, TransitionToGraphicsNode } from "./TransitionToGraphicsNode";

// -- Helper to map InstructionType to Node Name --
export const INSTRUCTION_NODE_MAP: Record<string, string> = {
    PlayDialog: "Events/PlayDialog",
    ShowDecision: "Events/BranchOptions",
    PlayBgm: "Events/PlayBgm",
    PlaySe: "Events/PlaySe",
    SetBgImg: "Events/SetBgImg",
    SetCharaImg: "Events/SetCharaImg",
    SleepOrFade: "Events/SleepOrFade",
    TransitionToGraphics: "Events/TransitionToGraphics",
    TransitionToGraphicsFade: "Events/TransitionToGraphicsFade",
    ShowCg: "Events/ShowCg",
    FadeSystemToBlack: "Events/FadeSystemToBlack",
    SetGraphicsState: "Events/SetGraphicsState",
    ToggleGraphicsFlag: "Events/ToggleGraphicsFlag",
    ShakeScreen: "Events/ShakeScreen",
    ToggleStaffState: "Events/ToggleStaffState",
    ShowStaffA: "Events/ShowStaffA",
    ShowStaffB: "Events/ShowStaffB",
};

// -- Registration Function --
export function registerEventNodes() {
    LiteGraph.registerNodeType("Events/PlayDialog", PlayDialogNode);
    LiteGraph.registerNodeType("Events/BranchOptions", BranchOptionsNode);
    LiteGraph.registerNodeType("Events/Start", EventStartNode);
    LiteGraph.registerNodeType("Events/End", EventEndNode);

    // Explicit image nodes
    LiteGraph.registerNodeType("Events/SetBgImg", SetBgImgNode);
    LiteGraph.registerNodeType("Events/SetCharaImg", SetCharaImgNode);
    LiteGraph.registerNodeType("Events/TransitionToGraphics", TransitionToGraphicsNode);
    LiteGraph.registerNodeType("Events/TransitionToGraphicsFade", TransitionToGraphicsFadeNode);
    LiteGraph.registerNodeType("Events/ShowCg", ShowCgNode);

    // Register generic nodes for others
    const manualNodes = [
        "PlayDialog",
        "ShowDecision",
        "SetBgImg",
        "SetCharaImg",
        "TransitionToGraphics",
        "TransitionToGraphicsFade",
        "ShowCg",
    ];
    const others = Object.keys(INSTRUCTION_NODE_MAP).filter(k => !manualNodes.includes(k));

    others.forEach(key => {
        // Create dynamic class for each to have correct title
        class DynamicNode extends GenericEventNode {
            static title = key;
            constructor() {
                super(key);
            }
        }
        LiteGraph.registerNodeType(INSTRUCTION_NODE_MAP[key], DynamicNode);
    });
}
