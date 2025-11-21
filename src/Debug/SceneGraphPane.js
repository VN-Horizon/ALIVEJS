import { Pane } from '../../lib/tweakpane-4.0.5.min.js';
import { createPaneContainer } from './DebugPane.js';

const pane = new Pane({
    title: 'Events Graph',
    container: createPaneContainer(),
});

let graphContainer = null;
let simulation = null;
let svgElement = null;
let linkGroupElement = null;
let nodeGroupElement = null;
let currentWidth = 400;
let currentHeight = 230;
let lastBlockIndex = -1;

export function initSceneGraphPane(engine) {
    // Create a custom HTML container for the graph
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '250px';
    container.style.background = '#1a1a1a';
    container.style.borderRadius = '2px';
    container.style.overflow = 'hidden';
    
    // Add it to the pane container
    pane.element.appendChild(container);
    graphContainer = container;
    
    // Create SVG with zoom/pan capability
    const svg = d3.select(container)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '250px')
        .style('display', 'block');
    
    svgElement = svg;
    currentWidth = 300;
    currentHeight = 250;
    
    // Create a group for zoom/pan
    const g = svg.append('g');
    
    const linkGroup = g.append('g').attr('class', 'links');
    const nodeGroup = g.append('g').attr('class', 'nodes');
    
    linkGroupElement = linkGroup;
    nodeGroupElement = nodeGroup;
    
    // Add zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });
    
    svg.call(zoom);
    
    // Store zoom for later use
    svgElement.zoom = zoom;
    svgElement.zoomGroup = g;
    
    // Listen for event progression
    document.addEventListener('PlayDialogInternal', () => {
        updateCurrentEventHighlight();
    });
    
    document.addEventListener('ShowDecisionInternal', () => {
        updateCurrentEventHighlight();
    });
    
    // Add refresh button
    const refreshBtn = pane.addButton({
        title: 'Refresh Graph',
    });
    refreshBtn.on('click', () => {
        renderGraph(svg, linkGroup, nodeGroup, currentWidth, currentHeight);
    });
    $(document).on('EventsLoaded', () => {
        renderGraph(svg, linkGroup, nodeGroup, currentWidth, currentHeight);
        updateCurrentEventHighlight();
        ticked();
    });
}

function ticked() {
    simulation.tick(1);
    requestAnimationFrame(ticked);
}

function renderGraph(svg, linkGroup, nodeGroup, width, height) {
    const { nodes, links } = getEventsGraphData();
    
    // Stop existing simulation
    if (simulation) {
        simulation.stop();
    }
    
    // Create force simulation
    simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links)
            .id(d => d.id)
            .distance(20))
        .force('charge', d3.forceManyBody().strength(-20))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(17));
    
    // Update links with arrows
    const linkSelection = linkGroup
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('stroke', '#666')
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.6)
        .attr('marker-end', 'url(#arrowhead)');
    
    // Add arrow marker definition
    svg.selectAll('defs').data([0]).join('defs')
        .selectAll('marker')
        .data([0])
        .join('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '-0 -5 10 10')
        .attr('refX', 18)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .selectAll('path')
        .data([0])
        .join('path')
        .attr('d', 'M 0,-5 L 10,0 L 0,5')
        .attr('fill', '#666');
    
    // Update nodes
    const nodeSelection = nodeGroup
        .selectAll('g')
        .data(nodes)
        .join('g')
        .call(createDrag(simulation));
    
    // Add circles to nodes
    nodeSelection
        .selectAll('circle')
        .data(d => [d])
        .join('circle')
        .attr('r', d => d.radius || 8)
        .attr('fill', d => d.color || '#00ffd6')
        .style('cursor', 'pointer')
        .on('mouseenter', function() {
            d3.select(this).attr('stroke', '#fff').attr('stroke-width', 2);
        })
        .on('mouseleave', function() {
            d3.select(this).attr('stroke', null);
        });
    
    // Add labels to nodes
    nodeSelection
        .selectAll('text')
        .data(d => [d])
        .join('text')
        .attr("class", "node-label")
        .attr("text-anchor", "middle")
        .attr("dy", 4)
        .attr('fill', '#fff')
        .attr('font-size', '10px')
        .text(d => d.label || d.id);
    
    // Update positions on tick
    simulation.on('tick', () => {
        linkSelection
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        nodeSelection
            .attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    // Store node selection for updates
    svg.nodeSelection = nodeSelection;
}

function updateCurrentEventHighlight() {
    const screenplayContext = window.ScreenplayContext;
    if (!screenplayContext || !svgElement || !svgElement.nodeSelection) {
        return;
    }
    
    const currentBlockIndex = screenplayContext.currentBlockIndex;
    
    // Only update if block index has changed
    if (currentBlockIndex === lastBlockIndex) {
        return;
    }
    
    lastBlockIndex = currentBlockIndex;
    
    // Update node colors
    svgElement.nodeSelection.selectAll('circle')
        .transition()
        .duration(300)
        .attr('fill', d => {
            const event = screenplayContext.blocks[d.index];
            
            // Highlight current event
            if (d.index === currentBlockIndex) {
                return '#ff6b6b'; // red for current
            }
            
            // Regular colors
            if (event.hasChoices) {
                return '#ff9ff3'; // pink for choices
            } else if (event.evFunc && event.evFunc.length > 0) {
                return '#feca57'; // yellow for functions
            }
            return '#4ecdc4'; // default teal
        })
        .attr('r', d => {
            if (d.index === currentBlockIndex) {
                return (d.radius || 10) + 4; // Larger radius for current
            }
            return d.radius || 10;
        });
    
    // Add pulse effect to current node
    svgElement.nodeSelection.selectAll('circle')
        .filter(d => d.index === currentBlockIndex)
        .attr('stroke', '#fff')
        .attr('stroke-width', 3)
        .attr('stroke-opacity', 1)
        .transition()
        .duration(800)
        .attr('stroke-opacity', 0.3)
        .transition()
        .duration(800)
        .attr('stroke-opacity', 1);
    
    // Center on current node
    const currentNode = svgElement.nodeSelection.data().find(d => d.index === currentBlockIndex);
    if (currentNode && currentNode.x && currentNode.y) {
        const transform = d3.zoomIdentity
            .scale(1)
            .translate(-currentNode.x, -currentNode.y)
            .translate(currentWidth / 2, currentHeight / 2);
        
        svgElement.transition()
            .duration(750)
            .call(svgElement.zoom.transform, transform);
    }
}

function createDrag(simulation) {
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }
    
    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }
    
    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }
    
    return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
}

function getEventsGraphData() {
    const screenplayContext = window.ScreenplayContext;
    if (!screenplayContext || !screenplayContext.blocks) {
        return { nodes: [], links: [] };
    }
    
    const nodes = [];
    const links = [];
    const nodeMap = new Map();
    
    // Create nodes for each event
    screenplayContext.blocks.forEach((event, index) => {
        const evId = event.evId;
        const nodeId = `ev_${evId}`;
        
        // Determine node color based on event properties
        let color = '#4ecdc4'; // default teal
        if (event.hasChoices) {
            color = '#ff9ff3'; // pink for choice events
        } else if (event.evFunc && event.evFunc.length > 0) {
            color = '#feca57'; // yellow for events with functions
        }
        
        // Check if this is the current event
        if (index === screenplayContext.currentBlockIndex) {
            color = '#ff6b6b'; // red for current event
        }
        
        const node = {
            id: nodeId,
            label: `${evId}`,
            color: color,
            radius: event.hasChoices ? 12 : 10,
            evId: evId,
            index: index
        };
        
        nodes.push(node);
        nodeMap.set(evId, node);
    });
    
    // Create links based on return_values and from_events
    screenplayContext.blocks.forEach((event) => {
        const sourceId = `ev_${event.evId}`;
        
        // Links from return_values (outgoing connections)
        if (event.returnValues && event.returnValues.length > 0) {
            event.returnValues.forEach((targetEvId) => {
                if (nodeMap.has(targetEvId)) {
                    links.push({
                        source: sourceId,
                        target: `ev_${targetEvId}`
                    });
                }
            });
        }
    });
    
    return { nodes, links };
}
