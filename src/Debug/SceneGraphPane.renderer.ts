import * as d3 from "d3";
import { execUntilNextLine } from "../Core/Events";
import {
  ACTIVE_NODE_COLOR,
  CHOICE_NODE_COLOR,
  CONDITIONAL_LINK_COLOR,
  DEFAULT_LINK_COLOR,
  DEFAULT_NODE_COLOR,
  FUNCTION_NODE_COLOR,
  SCENE_GRAPH_CHARGE_STRENGTH,
  SCENE_GRAPH_COLLISION_RADIUS,
  SCENE_GRAPH_LINK_DISTANCE,
  SCENE_GRAPH_MAX_ZOOM,
  SCENE_GRAPH_MIN_ZOOM,
} from "./SceneGraphPane.constants";
import { buildSceneGraphData, getScreenplayContext } from "./SceneGraphPane.data";
import type { SceneGraphLink, SceneGraphNode } from "./SceneGraphPane.types";

interface SceneGraphRenderer {
  renderGraph: () => void;
  updateCurrentEventHighlight: () => void;
}

export function createSceneGraphRenderer(
  svgElement: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  width: number,
  height: number
): SceneGraphRenderer {
  let simulation: d3.Simulation<SceneGraphNode, SceneGraphLink> | null = null;
  let nodeSelection: d3.Selection<SVGGElement, SceneGraphNode, SVGGElement, unknown> | null = null;
  let lastIndex = -1;

  const zoomGroup = svgElement.append("g");
  const linkGroup = zoomGroup.append("g").attr("class", "links");
  const nodeGroup = zoomGroup.append("g").attr("class", "nodes");

  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([SCENE_GRAPH_MIN_ZOOM, SCENE_GRAPH_MAX_ZOOM])
    .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      zoomGroup.attr("transform", event.transform.toString());
    });

  svgElement.call(zoom);

  const renderGraph = (): void => {
    const { nodes, links } = buildSceneGraphData();

    if (simulation) {
      simulation.stop();
    }

    if (nodes.length === 0) {
      nodeSelection = null;
      lastIndex = -1;
      linkGroup.selectAll("*").remove();
      nodeGroup.selectAll("*").remove();
      return;
    }

    simulation = d3
      .forceSimulation<SceneGraphNode>(nodes)
      .alphaDecay(0.001)
      .alpha(2)
      .alphaMin(0)
      .force(
        "link",
        d3
          .forceLink<SceneGraphNode, SceneGraphLink>(links)
          .id((d) => d.id)
          .distance(SCENE_GRAPH_LINK_DISTANCE)
      )
      .force("charge", d3.forceManyBody<SceneGraphNode>().strength(SCENE_GRAPH_CHARGE_STRENGTH))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<SceneGraphNode>().radius(SCENE_GRAPH_COLLISION_RADIUS));

    const defs = svgElement.selectAll<SVGDefsElement, null>("defs").data([null]).join("defs");

    defs
      .selectAll<SVGMarkerElement, null>("marker#arrowhead")
      .data([null])
      .join("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 24)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .selectAll<SVGPathElement, null>("path")
      .data([null])
      .join("path")
      .attr("d", "M 0,-5 L 10,0 L 0,5")
      .attr("fill", DEFAULT_LINK_COLOR);

    const uniqueColors = [
      ...new Set(links.map((link) => link.color).filter((color) => color !== DEFAULT_LINK_COLOR)),
    ];

    uniqueColors.forEach((color) => {
      const markerId = `arrowhead-${color.substring(1)}`;
      defs
        .selectAll<SVGMarkerElement, null>(`marker#${markerId}`)
        .data([null])
        .join("marker")
        .attr("id", markerId)
        .attr("viewBox", "-0 -5 10 10")
        .attr("refX", 12)
        .attr("refY", 0)
        .attr("orient", "auto")
        .attr("markerWidth", 7)
        .attr("markerHeight", 7)
        .selectAll<SVGPathElement, null>("path")
        .data([null])
        .join("path")
        .attr("d", "M 0,-5 L 10,0 L 0,5")
        .attr("fill", color);
    });

    defs
      .selectAll<SVGMarkerElement, null>("marker#arrowhead-default")
      .data([null])
      .join("marker")
      .attr("id", "arrowhead-default")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 24)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .selectAll<SVGPathElement, null>("path")
      .data([null])
      .join("path")
      .attr("d", "M 0,-5 L 10,0 L 0,5")
      .attr("fill", DEFAULT_LINK_COLOR);

    defs
      .selectAll<SVGMarkerElement, null>("marker#arrowhead-green")
      .data([null])
      .join("marker")
      .attr("id", "arrowhead-green")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 24)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .selectAll<SVGPathElement, null>("path")
      .data([null])
      .join("path")
      .attr("d", "M 0,-5 L 10,0 L 0,5")
      .attr("fill", CONDITIONAL_LINK_COLOR);

    const linkSelection = linkGroup
      .selectAll<SVGLineElement, SceneGraphLink>("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => d.color || DEFAULT_LINK_COLOR)
      .attr("stroke-width", (d) => (d.color !== DEFAULT_LINK_COLOR ? 2.5 : 1.5))
      .attr("stroke-opacity", (d) => (d.color !== DEFAULT_LINK_COLOR ? 0.8 : 0.6))
      .attr("marker-end", (d) => {
        if (d.isConditional) {
          return "url(#arrowhead-green)";
        }
        return d.color !== DEFAULT_LINK_COLOR
          ? `url(#arrowhead-${d.color.substring(1)})`
          : "url(#arrowhead-default)";
      });

    const linkLabelSelection = linkGroup
      .selectAll<SVGTextElement, SceneGraphLink>("text.link-label")
      .data(links.filter((link) => link.label))
      .join("text")
      .attr("class", "link-label")
      .attr("text-anchor", "middle")
      .attr("dy", -4)
      .attr("fill", "white")
      .attr("font-size", "10px")
      .attr("font-family", "Segoe UI, Arial, sans-serif")
      .style("pointer-events", "none")
      .text((d) => d.label || "");

    nodeSelection = nodeGroup
      .selectAll<SVGGElement, SceneGraphNode>("g")
      .data(nodes)
      .join("g")
      .call(createDrag(simulation));

    nodeSelection
      .selectAll<SVGCircleElement, SceneGraphNode>("circle")
      .data((d) => [d])
      .join("circle")
      .attr("r", (d) => d.radius || 8)
      .attr("fill", (d) => d.color || DEFAULT_NODE_COLOR)
      .style("cursor", "pointer")
      .on("mouseenter", function (this: SVGCircleElement) {
        d3.select(this).attr("stroke", "#fff").attr("stroke-width", 2);
      })
      .on("mouseleave", function (this: SVGCircleElement) {
        d3.select(this).attr("stroke", null);
      })
      .on("click", function (_event: MouseEvent, d: SceneGraphNode) {
        if (d.id === undefined || d.id < 0) {
          return;
        }

        const screenplayContext = getScreenplayContext();
        if (screenplayContext && screenplayContext.blocks[d.id]) {
          screenplayContext.currentEvId = d.id;
          screenplayContext.currentBlockIndex = screenplayContext.evIdToBlockIndex[d.id] || 0;
          screenplayContext.currentInstructionIndex = 0;
          updateCurrentEventHighlight();
          execUntilNextLine();

          console.log(`Jumped to event block ${d.id} (evId: ${d.id})`);
        }
      });

    nodeSelection
      .selectAll<SVGTextElement, SceneGraphNode>("text")
      .data((d) => [d])
      .join("text")
      .attr("class", "node-label")
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .attr("fill", "#000")
      .attr("font-size", "11px")
      .attr("font-family", "Segoe UI, Arial, sans-serif")
      .style("pointer-events", "none")
      .text((d) => d.label || String(d.id));

    simulation.on("tick", () => {
      linkSelection
        .attr("x1", (d) => getEndpointX(d.source))
        .attr("y1", (d) => getEndpointY(d.source))
        .attr("x2", (d) => getEndpointX(d.target))
        .attr("y2", (d) => getEndpointY(d.target));

      linkLabelSelection
        .attr("x", (d) => (getEndpointX(d.source) + getEndpointX(d.target)) / 2)
        .attr("y", (d) => (getEndpointY(d.source) + getEndpointY(d.target)) / 2);

      nodeSelection?.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    lastIndex = -1;
    updateCurrentEventHighlight();
  };

  const updateCurrentEventHighlight = (): void => {
    const screenplayContext = getScreenplayContext();
    if (!screenplayContext || !nodeSelection) {
      return;
    }

    const currentEvId = screenplayContext.currentEvId;
    if (currentEvId === lastIndex) {
      return;
    }
    lastIndex = currentEvId;

    nodeSelection
      .selectAll<SVGCircleElement, SceneGraphNode>("circle")
      .transition()
      .duration(300)
      .attr("fill", (d) => {
        if (d.id === undefined || d.id < 0) {
          return DEFAULT_NODE_COLOR;
        }

        const block = screenplayContext.blocks[d.id];
        if (d.id === currentEvId) {
          return ACTIVE_NODE_COLOR;
        }
        if (block?.hasChoices) {
          return CHOICE_NODE_COLOR;
        }
        if (hasRenderableFunctionValue(block?.evFunc)) {
          return FUNCTION_NODE_COLOR;
        }
        return DEFAULT_NODE_COLOR;
      })
      .attr("r", (d) => {
        if (d.id === currentEvId) {
          return (d.radius || 10) + 4;
        }
        return d.radius || 10;
      });

    const currentNode = nodeSelection.data().find((d) => d.id === currentEvId);
    if (currentNode && currentNode.x !== undefined && currentNode.y !== undefined) {
      const transform = d3.zoomIdentity
        .scale(1)
        .translate(-currentNode.x, -currentNode.y)
        .translate(width / 2, height / 2);

      svgElement.transition().duration(750).call(zoom.transform, transform);
    }
  };

  return {
    renderGraph,
    updateCurrentEventHighlight,
  };
}

function createDrag(simulation: d3.Simulation<SceneGraphNode, SceneGraphLink>) {
  return d3
    .drag<SVGGElement, SceneGraphNode>()
    .on("start", (event: d3.D3DragEvent<SVGGElement, SceneGraphNode, SceneGraphNode>) => {
      if (!event.active) {
        simulation.alphaTarget(0.3).restart();
      }
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    })
    .on("drag", (event: d3.D3DragEvent<SVGGElement, SceneGraphNode, SceneGraphNode>) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    })
    .on("end", (event: d3.D3DragEvent<SVGGElement, SceneGraphNode, SceneGraphNode>) => {
      if (!event.active) {
        simulation.alphaTarget(0);
      }
      event.subject.fx = null;
      event.subject.fy = null;
    });
}

function hasRenderableFunctionValue(value: unknown): boolean {
  if (typeof value === "string" || Array.isArray(value)) {
    return value.length > 0;
  }
  return false;
}

function getEndpointX(endpoint: number | SceneGraphNode | string | undefined): number {
  const node = typeof endpoint === "object" && endpoint !== null ? endpoint : undefined;
  return node?.x ?? 0;
}

function getEndpointY(endpoint: number | SceneGraphNode | string | undefined): number {
  const node = typeof endpoint === "object" && endpoint !== null ? endpoint : undefined;
  return node?.y ?? 0;
}
