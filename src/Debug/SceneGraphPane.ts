import * as d3 from "d3";
import $ from "jquery";

import { SCENE_GRAPH_HEIGHT_RATIO, SCENE_GRAPH_PANE_ID, SCENE_GRAPH_REFRESH_LABEL, SCENE_GRAPH_WIDTH } from "./SceneGraphPane.constants";
import { createSceneGraphRenderer } from "./SceneGraphPane.renderer";
import { ensureSceneGraphPaneStyles } from "./SceneGraphPane.styles";

let isInitialized = false;

export function initSceneGraphPane(): void {
    if (isInitialized) {
        return;
    }
    isInitialized = true;

    const currentWidth = SCENE_GRAPH_WIDTH;
    const currentHeight = window.innerHeight * SCENE_GRAPH_HEIGHT_RATIO;

    ensureSceneGraphPaneStyles(currentWidth, currentHeight);

    const $container = $("<div>").attr("id", SCENE_GRAPH_PANE_ID);
    const $toolbar = $("<div>").addClass("scene-graph-pane__toolbar");
    const $refreshBtn = $("<button>")
        .attr("type", "button")
        .addClass("scene-graph-pane__refresh")
        .text(SCENE_GRAPH_REFRESH_LABEL);
    const $graphHost = $("<div>").addClass("scene-graph-pane__graph");

    $toolbar.append($refreshBtn);
    $container.append($toolbar, $graphHost);
    $("body").append($container);

    const svgElement = d3.select($graphHost.get(0)!)
        .append("svg")
        .attr("width", currentWidth)
        .attr("height", currentHeight)
        .attr("aria-label", "Scene graph");

    const renderer = createSceneGraphRenderer(svgElement, currentWidth, currentHeight);

    document.addEventListener("PlayDialogInternal", () => {
        renderer.updateCurrentEventHighlight();
    });

    document.addEventListener("ShowDecisionInternal", () => {
        renderer.updateCurrentEventHighlight();
    });

    $refreshBtn.on("click", () => {
        renderer.renderGraph();
    });

    $(document).on("EventsLoaded", () => {
        renderer.renderGraph();
    });
}

