import { Pane } from '../../lib/tweakpane-4.0.5.min.js';
import { execUntilNextLine } from '../Core/Events.js';
import { createPaneContainer } from './DebugPane.js';

const container = createPaneContainer();

$(container).css({
    height: '90vh',
    position: 'fixed',
    right: '10px',
    top: '10px',
});

const pane = new Pane({
    title: 'Events Graph',
    container: container,
});

let simulation = null;
let svgElement = null;
let currentWidth = 400;
let currentHeight = window.innerHeight * 0.9;
let lastIndex = -1;

export function initSceneGraphPane() {
    // Create a custom HTML container for the graph
    const container = document.createElement('div');
    container.style.width = `${currentWidth}px`;
    container.style.height = `${currentHeight}px`;
    // Add it to the pane container
    pane.element.appendChild(container);
    // Create SVG with zoom/pan capability
    svgElement = d3.select(container)
        .append('svg')
        .attr('width', currentWidth)
        .attr('height', currentHeight)
        .style('display', 'block');
    
    // Create a group for zoom/pan
    const g = svgElement.append('g');

    const linkGroup = g.append('g').attr('class', 'links');
    const nodeGroup = g.append('g').attr('class', 'nodes');
    
    // Add zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });
    
    svgElement.call(zoom);
    
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
        renderGraph(svgElement, linkGroup, nodeGroup, currentWidth, currentHeight);
    });
    $(document).on('EventsLoaded', () => {
        renderGraph(svgElement, linkGroup, nodeGroup, currentWidth, currentHeight);
        updateCurrentEventHighlight();
    });
}
function renderGraph(svgElement, linkGroup, nodeGroup, width, height) {
    const { nodes, links } = getEventsGraphData();
    
    // Stop existing simulation
    if (simulation) {
        simulation.stop();
    }
    
    // Create force simulation
    simulation = d3.forceSimulation(nodes)
        // .alphaTarget(1)
        .alphaDecay(0.001)
        .alpha(2)
        .alphaMin(0)
        .force('link', d3.forceLink(links)
            .id(d => d.id)
            .distance(20    ))
        .force('charge', d3.forceManyBody().strength(-20))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(15));
    
    // Update links with arrows
    const linkSelection = linkGroup
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('stroke', d => d.color || '#666')
        .attr('stroke-width', d => d.color !== '#666' ? 2.5 : 1.5)
        .attr('stroke-opacity', d => d.color !== '#666' ? 0.8 : 0.6)
        .attr('marker-end', d => d.color !== '#666' ? `url(#arrowhead-${d.color.substring(1)})` : 'url(#arrowhead)');
    
    // Add arrow marker definitions
    const defs = svgElement.selectAll('defs').data([0]).join('defs');
    
    // Default arrow marker
    defs.selectAll('marker#arrowhead')
        .data([0])
        .join('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '-0 -5 10 10')
        .attr('refX', 24)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .selectAll('path')
        .data([0])
        .join('path')
        .attr('d', 'M 0,-5 L 10,0 L 0,5')
        .attr('fill', '#666');
    
    // Colored arrow markers for END paths
    const uniqueColors = [...new Set(links.filter(l => l.color !== '#666').map(l => l.color))];
    uniqueColors.forEach(color => {
        const markerId = `arrowhead-${color.substring(1)}`;
        defs.selectAll(`marker#${markerId}`)
            .data([0])
            .join('marker')
            .attr('id', markerId)
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 12)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 7)
            .attr('markerHeight', 7)
            .selectAll('path')
            .data([0])
            .join('path')
            .attr('d', 'M 0,-5 L 10,0 L 0,5')
            .attr('fill', color);
    });
    
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
        })
        .on('click', function(event, d) {
            if (d.index !== undefined && d.index >= 0) {
                const screenplayContext = window.ScreenplayContext;
                if (screenplayContext && screenplayContext.blocks[d.index]) {
                    screenplayContext.currentBlockIndex = d.index;
                    screenplayContext.currentInstructionIndex = 0;
                    updateCurrentEventHighlight();
                    execUntilNextLine();
                    
                    console.log(`Jumped to event block ${d.index} (evId: ${d.id})`);
                }
            }
        });
    
    // Add labels to nodes
    nodeSelection
        .selectAll('text')
        .data(d => [d])
        .join('text')
        .attr("class", "node-label")
        .attr("text-anchor", "middle")
        .attr("dy", 4)
        .attr('fill', '#000')
        .attr('font-size', '11px')
        .attr('font-family', 'Segoe UI, Arial, sans-serif')
        .style('pointer-events', 'none')
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
    svgElement.nodeSelection = nodeSelection;
}

function updateCurrentEventHighlight() {
    const screenplayContext = window.ScreenplayContext;
    if (!screenplayContext || !svgElement || !svgElement.nodeSelection) {
        return;
    }

    const currentIndex = screenplayContext.currentBlockIndex;
    if (currentIndex === lastIndex) return;
    lastIndex = currentIndex;

    // Update node colors
    svgElement.nodeSelection.selectAll('circle')
        .transition()
        .duration(300)
        .attr('fill', d => {
            if(!d || !d.index || d.index < 0) return '#4ecdc4';
            const blk = screenplayContext.blocks[d.index];
            if (d.index === currentIndex) return '#ff6b6b';
            if (blk && blk.hasChoices) return '#ff9ff3';
            if (blk && blk.evFunc && blk.evFunc.length > 0) return '#feca57';
            return '#4ecdc4';
        })
        .attr('r', d => {
            if (d.index === currentIndex) return (d.radius || 10) + 4;
            return d.radius || 10;
        });
    
    // Center on current node
    const currentNode = svgElement.nodeSelection.data().find(d => d.index === currentIndex);
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
    return d3.drag()
        .on('start', (e) => {
            if (!e.active) simulation.alphaTarget(0.3).restart();
            e.subject.fx = e.subject.x;
            e.subject.fy = e.subject.y;
        })
        .on('drag', (e) => {
            e.subject.fx = e.x;
            e.subject.fy = e.y;
        })
        .on('end', (e) => {
            if (!e.active) simulation.alphaTarget(0);
            e.subject.fx = null;
            e.subject.fy = null;
        });
}

function getEventsGraphData() {
    const screenplayContext = window.ScreenplayContext;
    if (!screenplayContext || !screenplayContext.blocks) {
        return { nodes: [], links: [] };
    }
    const links = [];
    const nodeMap = new Map();
    screenplayContext.blocks.forEach((event, index) => {
        const evId = event.evId;
        const nodeId = evId;
        let color = '#4ecdc4';
        if (event.hasChoices) color = '#ff9ff3';
        else if (event.evFunc && event.evFunc.length > 0) color = '#feca57';
        if (index === screenplayContext.currentBlockIndex) color = '#ff6b6b';

        const node = {
            id: nodeId,
            label: `${evId}`,
            color: color,
            radius: event.hasChoices ? 12 : 10,
        };
        
        nodeMap.set(evId, node);
    });
    nodeMap.set(7090644, {id: 7090644, radius: 16, color: '#dd1effff', label: 'END'});
    
    // Build links first
    screenplayContext.blocks.forEach((event) => {
        const sourceId = event.evId;
        if (event.returnValues && event.returnValues.length > 0) {
            event.returnValues.forEach((targetEvId) => {
                if (!nodeMap.has(targetEvId)) return;
                links.push({
                    source: sourceId,
                    target: targetEvId,
                    color: '#666'
                });
            });
        }
    });
    
    // Find all nodes that point to END (7090644)
    const nodesPointingToEnd = links
        .filter(link => link.target === 7090644)
        .map(link => link.source);
    
    // Build adjacency map (reverse - who points to whom)
    const incomingMap = new Map();
    links.forEach(link => {
        if (!incomingMap.has(link.target)) {
            incomingMap.set(link.target, []);
        }
        incomingMap.get(link.target).push(link.source);
    });
    
    // Color palette
    const pathColors = [
        '#ff6b6b', '#4ecdc4', '#f7b731', 
        '#5f27cd', '#86d300ff', '#ff9ff3', '#fe57fbff',
        '#b0e4efff', '#ff6348', '#1dd1a1',
        '#c44569', '#dff800ff', '#778beb', '#e77f67'
    ];
    
    // Trace back from each node pointing to END to find root nodes
    const pathColorMap = new Map(); // Maps each node to its path color
    let colorIndex = 0;
    
    nodesPointingToEnd.forEach(nodeId => {
        // Trace backward to find root
        const visited = new Set();
        const traceBackToRoot = (currentNode) => {
            if (visited.has(currentNode)) return currentNode;
            visited.add(currentNode);
            
            const parents = incomingMap.get(currentNode) || [];
            if (parents.length === 0) {
                // This is a root node
                return currentNode;
            }
            
            // Continue tracing back through all parents
            const roots = parents.map(parent => traceBackToRoot(parent));
            return roots[0]; // Return first root found
        };
        
        const rootNode = traceBackToRoot(nodeId);
        
        // Assign color based on root node
        if (!pathColorMap.has(rootNode)) {
            pathColorMap.set(rootNode, pathColors[colorIndex % pathColors.length]);
            colorIndex++;
        }
        
        const pathColor = pathColorMap.get(rootNode);
        
        // Now color all nodes in the path from root to END
        const colorPath = (node, color) => {
            if (pathColorMap.has(node) && pathColorMap.get(node) !== color) {
                return; // Already colored by another path
            }
            pathColorMap.set(node, color);
            
            // Color all links from this node
            links.forEach(link => {
                if (link.source === node) {
                    link.color = color;
                    // Recursively color downstream
                    if (link.target !== 7090644) {
                        colorPath(link.target, color);
                    }
                }
            });
        };
        
        colorPath(rootNode, pathColor);
    });

    return { nodes: Array.from(nodeMap.values()), links };
}
