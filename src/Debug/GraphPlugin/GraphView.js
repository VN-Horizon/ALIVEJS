export class GraphView {
    constructor(doc, config) {
        this.value = config.value;
        
        // Create container element
        this.element = doc.createElement('div');
        this.element.classList.add('tp-graphv');
        
        // Create SVG element
        this.svgElement = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svgElement.setAttribute('width', '100%');
        this.svgElement.setAttribute('height', config.height || 300);
        this.svgElement.style.display = 'block';
        this.svgElement.style.background = '#1a1a1a';
        this.element.appendChild(this.svgElement);
        
        // Initialize D3 elements
        this.svg = d3.select(this.svgElement);
        this.width = config.width || 400;
        this.height = config.height || 300;
        
        // Create graph groups
        this.linkGroup = this.svg.append('g').attr('class', 'links');
        this.nodeGroup = this.svg.append('g').attr('class', 'nodes');
        
        // Store selections
        this.linkSelection = null;
        this.nodeSelection = null;
        
        // Listen for value changes
        this.value.emitter.on('change', () => {
            this.render();
        });
        
        // Initial render
        this.render();
    }
    
    render() {
        const graphData = this.value.rawValue;
        if (!graphData || !graphData.nodes) return;
        
        const nodes = graphData.nodes || [];
        const links = graphData.links || [];
        
        // Create force simulation
        if (this.simulation) {
            this.simulation.stop();
        }
        
        this.simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links)
                .id(d => d.id)
                .distance(50))
            .force('charge', d3.forceManyBody().strength(-200))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(15));
        
        // Update links
        this.linkSelection = this.linkGroup
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke', '#666')
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0.6);
        
        // Update nodes
        this.nodeSelection = this.nodeGroup
            .selectAll('g')
            .data(nodes)
            .join('g')
            .call(this.createDrag(this.simulation));
        
        // Add circles to nodes
        this.nodeSelection
            .selectAll('circle')
            .data(d => [d])
            .join('circle')
            .attr('r', d => d.radius || 8)
            .attr('fill', d => d.color || '#00ffd6');
        
        // Add labels to nodes
        this.nodeSelection
            .selectAll('text')
            .data(d => [d])
            .join('text')
            .attr('dx', 12)
            .attr('dy', 4)
            .attr('fill', '#fff')
            .attr('font-size', '10px')
            .text(d => d.label || d.id);
        
        // Update positions on tick
        this.simulation.on('tick', () => {
            this.linkSelection
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            
            this.nodeSelection
                .attr('transform', d => `translate(${d.x},${d.y})`);
        });
    }
    
    createDrag(simulation) {
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
    
    dispose() {
        if (this.simulation) {
            this.simulation.stop();
        }
    }
}
