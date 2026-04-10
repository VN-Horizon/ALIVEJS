import $ from "jquery";

import { SCENE_GRAPH_PANE_ID, SCENE_GRAPH_STYLE_ID } from "./SceneGraphPane.constants";

export function ensureSceneGraphPaneStyles(width: number, height: number): void {
  if (document.getElementById(SCENE_GRAPH_STYLE_ID)) {
    return;
  }

  $("head").append(`
        <style id="${SCENE_GRAPH_STYLE_ID}">
            #${SCENE_GRAPH_PANE_ID} {
                position: fixed;
                bottom: 10px;
                right: 10px;
                width: ${width}px;
                height: ${height}px;
                z-index: 9998;
                display: flex;
                flex-direction: column;
                gap: 8px;
                padding: 10px;
                border: 1px solid rgba(255, 255, 255, 0.14);
                border-radius: 10px;
                background: rgba(18, 18, 24, 0.94);
                box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
                color: #fff;
                backdrop-filter: blur(8px);
            }

            #${SCENE_GRAPH_PANE_ID} .scene-graph-pane__toolbar {
                display: flex;
                justify-content: flex-end;
            }

            #${SCENE_GRAPH_PANE_ID} .scene-graph-pane__refresh {
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.08);
                color: #fff;
                padding: 6px 10px;
                cursor: pointer;
            }

            #${SCENE_GRAPH_PANE_ID} .scene-graph-pane__refresh:hover {
                background: rgba(255, 255, 255, 0.16);
            }

            #${SCENE_GRAPH_PANE_ID} .scene-graph-pane__graph {
                flex: 1;
                min-height: 0;
            }

            #${SCENE_GRAPH_PANE_ID} svg {
                display: block;
                width: 100%;
                height: 100%;
            }
        </style>
    `);
}
