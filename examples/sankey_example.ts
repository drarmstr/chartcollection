// # C3 Sankey Energy Use Flow Chart
// _Demonstrates a Sankey flow chart of energy production and use_.

// Function to set the color based on the energy node name.
var source_color = d3.scale.category20b();


// # Create Sankey visualization for the US

// Create `Sankey` visualization object for **United States Energy Data**
var us_sankey = new c3.Sankey<USEnergyData, USEnergyLink>({
    // Bind to the DOM and set the height
    anchor: '#us_sankey_flowchart',
    height: 600,

    // **Accessor functions** to describe how to access the US energy data.
    key: (d) => d.name,
    value: (d) => d.btu,
    link_value: (l) => l.btu,

    // Set initial **node width**
    node_width: 100,

    // Create **tooltips** for the energy name.
    node_options: {
        title: (d) => d.name + '\n' + d.btu,
        animate: true,
    },
    // **Style** and **animate** the nodes based on name.
    rect_options: {
        styles: {
            fill: (d) => source_color(d.name),
            stroke: 'black',
        },
        animate: true,
    },
    // Create **tooltips** for the links between nodes
    link_options: {
        title: (l) => l.source + " → " + l.target + ": " + l.btu,
    },
    // **Style** and **animate** the links between nodes.
    path_options: {
        styles: {
            stroke: 'blue',
            opacity: 0.5,
        },
        animate: true,
    },

    // Add text **labels** for each node
    node_label_options: {
        text: (d) => d.name,
        styles: {
            'font-weight': 'bold',
            'text-shadow': '1px 1px 3px whitesmoke',
        },
        animate: true,
    },
});


// # Creat Sankey visualization for the UK
var uk_node_label_options: c3.SankeyLabelOptions<UKEnergyData>;

// Create `Sankey` visualization object for **United Kingdom Energy Data**
var uk_sankey = new c3.Sankey<UKEnergyData, UKEnergyLink>({
    // Bind to the DOM and set the height
    anchor: '#uk_sankey_flowchart',
    height: 600,

    // **Accessor functions** to describe how to access the UK energy data.
    // In this case, all of these link accessors happen to be the default, so not strictly required.
    // Because no `key` accessor is provided for the nodes, the key is simply the index into the data array.
    // Because no `value` accessor is provided for the nodes, the value of the node is derived as the
    // maximum of the input or output links.
    link_value: (l) => l.value,
    link_source: (l) => l.source,
    link_target: (l) => l.target,

    // Set the nodes to **align** on both the left and right sides for those nodes
    // without any inputs or outputs respectively.
    align: 'both',
    // Set the default **vertical padding** between nodes to be `15` pixels.
    // This could also be set to a string for a percentage, such as `20%`.
    node_padding: 15,

    // Create **tooltips** for the energy name.
    node_options: {
        title: (d) => d.name,
    },
    // **Style** the nodes based on name.
    rect_options: {
        styles: {
            fill: (d) => source_color(d.name.split(' ')[0]),
            stroke: 'black',
        },
    },
    // Create **tooltips** for the links between nodes
    link_options: {
        title: (l) => uk_energy_data.nodes[l.source].name + " → " + uk_energy_data.nodes[l.target].name + ": " + l.value,
    },
    // **Style** the links between nodes.
    path_options: {
        styles: {
            stroke: 'blue',
            opacity: 0.5,
        },
    },

    // Add text **labels** for each node
    node_label_options: uk_node_label_options =  {
        text: (d) => d.name,
        styles: {
            'font-weight': 'bold',
            'text-shadow': '1px 1px 3px whitesmoke',
        },
    },
});


// ## Configure charts based on user behavior

// Resize the charts if the window is resized
window.onresize = function () {
    us_sankey.resize();
    uk_sankey.resize();
};


// ### Adjust US flow graph from interactive form

// Animate flow changes when changing to data for different years
document.getElementById('us_year').addEventListener('change', function () {
    let element = <HTMLInputElement>this;
    us_sankey.data = us_energy_data[+element.value].nodes;
    us_sankey.links = us_energy_data[+element.value].links;
    us_sankey.redraw();
});

// Enable animation
document.getElementById('us_animate').addEventListener('change', function () {
    let element = <HTMLInputElement>this;
    us_sankey.node_options.animate = element.checked;
    us_sankey.rect_options.animate = element.checked;
    us_sankey.path_options.animate = element.checked;
    us_sankey.node_label_options.animate = element.checked;
});

// IE doesn't support `input` events
for (let event_name of ['input', 'change']) {
    // Set layout algorithm iterations
    document.querySelector('#us_iterations').addEventListener(event_name, function () {
        us_sankey.iterations = +this.value;
        us_sankey.redraw();
    });

    // Set layout algorithm alpha
    document.querySelector('#us_alpha').addEventListener(event_name, function () {
        us_sankey.alpha = +this.value;
        us_sankey.redraw();
    });

    // Set node width
    document.querySelector('#us_node_width').addEventListener(event_name, function () {
        us_sankey.node_width = +this.value;
        if ((<HTMLInputElement>document.querySelector('input[name=us_node_width_type]:checked')).value === 'percent')
            us_sankey.node_width = us_sankey.node_width + '%';
        us_sankey.redraw();
    });

    // Set node padding
    document.querySelector('#us_node_padding').addEventListener(event_name, function () {
        us_sankey.node_padding = +this.value;
        if ((<HTMLInputElement>document.querySelector('input[name=us_node_padding_type]:checked')).value === 'percent')
            us_sankey.node_padding = us_sankey.node_padding + '%';
        us_sankey.redraw();
    });

    // Set link path curvature
    document.getElementById('us_link_path_curvature').addEventListener(event_name, function () {
        us_sankey.link_path_curvature = +this.value;
        us_sankey.redraw();
    });
}

// Change node width when changing between percent or pixel based units.
for (let radio of document.forms['us_sankey'].elements['us_node_width_type']) {
    radio.addEventListener('change', function () {
        var event = document.createEvent('HTMLEvents');
        event.initEvent('change', true, true);
        document.getElementById('us_node_width').dispatchEvent(event);
    });
}
// Change node padding when changing between percent or pixel based units.
for (let radio of document.forms['us_sankey'].elements['us_node_padding_type']) {
    radio.addEventListener('change', function () {
        var event = document.createEvent('HTMLEvents');
        event.initEvent('change', true, true);
        document.getElementById('us_node_padding').dispatchEvent(event);
    });
}

// Change between straight and curved paths for links.
document.getElementById('us_link_path').addEventListener('change', function () {
    let element = <HTMLInputElement>this;
    us_sankey.link_path = element.value;
    us_sankey.redraw();

    // NOTE: _curved paths should style the `stroke` while straight paths should style the `fill`._
    if (element.value === 'curve')
        us_sankey.path_options.styles = { fill: 'none', stroke: 'blue', opacity: 0.5 };
    else if (element.value === 'straight')
        us_sankey.path_options.styles = { fill: 'green', stroke: 'none', opacity: 0.5 };
    us_sankey.restyle();
});

// Select horizontal or vertical labels
for (let radio of document.forms['us_sankey'].elements['us_node_label_orientation']) {
    radio.addEventListener('change', function () {
        us_sankey.node_label_options.orientation = this.value;
        us_sankey.redraw();
    });
}


// ### Adjust UK flow graph from interactive form

// Set node alignment justification
document.getElementById('uk_align').addEventListener('change', function () {
    let element = <HTMLInputElement>this;
    uk_sankey.align = element.value;
    uk_sankey.redraw();
});

// IE doesn't support `input` events
for (let event_name of ['input', 'change']) {
    // Set layout algorithm iterations
    document.querySelector('#uk_iterations').addEventListener(event_name, function () {
        uk_sankey.iterations = +this.value;
        uk_sankey.redraw();
    });

    // Set layout algorithm alpha
    document.querySelector('#uk_alpha').addEventListener(event_name, function () {
        uk_sankey.alpha = +this.value;
        uk_sankey.redraw();
    });

    // Set node width
    document.querySelector('#uk_node_width').addEventListener(event_name, function () {
        uk_sankey.node_width = +this.value;
        if ((<HTMLInputElement>document.querySelector('input[name=uk_node_width_type]:checked')).value === 'percent')
            uk_sankey.node_width = uk_sankey.node_width + '%';
        uk_sankey.redraw();
    });

    // Set node padding
    document.querySelector('#uk_node_padding').addEventListener(event_name, function () {
        uk_sankey.node_padding = +this.value;
        if ((<HTMLInputElement>document.querySelector('input[name=uk_node_padding_type]:checked')).value === 'percent')
            uk_sankey.node_padding = uk_sankey.node_padding + '%';
        uk_sankey.redraw();
    });

    // Set link path curvature
    document.getElementById('uk_link_path_curvature').addEventListener(event_name, function () {
        uk_sankey.link_path_curvature = +this.value;
        uk_sankey.redraw();
    });
}

// Change node width when changing between percent or pixel based units.
for (let radio of document.forms['uk_sankey'].elements['uk_node_width_type']) {
    radio.addEventListener('change', function () {
        var event = document.createEvent('HTMLEvents');
        event.initEvent('change', true, true);
        document.getElementById('uk_node_width').dispatchEvent(event);
    });
}
// Change node padding when changing between percent or pixel based units.
for (let radio of document.forms['uk_sankey'].elements['uk_node_padding_type']) {
    radio.addEventListener('change', function () {
        var event = document.createEvent('HTMLEvents');
        event.initEvent('change', true, true);
        document.getElementById('uk_node_padding').dispatchEvent(event);
    });
}

// Change between straight and curved paths for links.
document.getElementById('uk_link_path').addEventListener('change', function () {
    let element = <HTMLInputElement>this;
    uk_sankey.link_path = element.value;
    uk_sankey.redraw();

    // NOTE: _curved paths should style the `stroke` while straight paths should style the `fill`._
    if (element.value === 'curve')
        uk_sankey.path_options.styles = { fill: 'none', stroke: 'blue', opacity: 0.5 };
    else if (element.value === 'straight')
        uk_sankey.path_options.styles = { fill: 'green', stroke: 'none', opacity: 0.5 };
    uk_sankey.restyle();
});

// Enable extra data with backedges to demonstrate support for graphs with backedges / cycles
document.getElementById('uk_backedge').addEventListener('change', function () {
    let element = <HTMLInputElement>this;
    uk_sankey.links = element.checked
      ? d3.merge([uk_energy_data.links, uk_energy_data_backedges])
      : uk_energy_data.links;
    uk_sankey.redraw();
});

// Enable/disable node labels
document.getElementById('uk_node_labels').addEventListener('change', function () {
    let element = <HTMLInputElement>this;
    uk_sankey.node_label_options = element.checked ? uk_node_label_options : null;
    uk_sankey.redraw();
});


// # Sample Energy Data

// ### Structure for US energy data

// Structure for US energy nodes.
// `name` for the name of the node.
// `btu` represents the energy flow in Quads BTU units.
interface USEnergyData {
    name: string;
    btu: number;
}
// Structure for the links between US energy nodes.
// `source` is the name of the source node for each link.
// `target` is the name of the target node for each link.
// `btu` represents the energy flow in Quads BTU units.
interface USEnergyLink {
    source: string;
    target: string;
    btu: number;
}

// ### US Energy Data from Lawrence Livermore National Laboratory

var us_energy_data = {
    2014: {
        nodes: [
            { name: "Solar", btu: 0.427 },
            { name: "Nuclear", btu: 8.33 },
            { name: "Hydro", btu: 2.47 },
            { name: "Wind", btu: 1.73 },
            { name: "Geothermal", btu: 0.202 },
            { name: "Natural Gas", btu: 27.5 },
            { name: "Coal", btu: 17.9 },
            { name: "Biomass", btu: 4.78 },
            { name: "Petroleum", btu: 34.8 },
            { name: "Electricity", btu: 38.564 },
            { name: "Imports", btu: 0.164 },
            { name: "Residential", btu: 11.8 },
            { name: "Commercial", btu: 8.93 },
            { name: "Industrial", btu: 24.7 },
            { name: "Transportation", btu: 27.1 },
            { name: "Wasted", btu: 59.4 },
            { name: "Useful", btu: 38.9 },
            { name: "EXTRA NODE", btu: 99999 },  // Demonstrate node with no links is not rendered
        ], links: [
            { source: "Solar", target: "Electricity", btu: 0.17 },
            { source: "Solar", target: "Residential", btu: 0.252 },
            { source: "Nuclear", target: "Electricity", btu: 8.33 },
            { source: "Hydro", target: "Electricity", btu: 2.44 },
            { source: "Hydro", target: "Industrial", btu: 0.0257 },
            { source: "Wind", target: "Electricity", btu: 1.73 },
            { source: "Geothermal", target: "Electricity", btu: 0.159 },
            { source: "Geothermal", target: "Residential", btu: 0.0197 },
            { source: "Geothermal", target: "Commercial", btu: 0.0197 },
            { source: "Natural Gas", target: "Electricity", btu: 8.37 },
            { source: "Natural Gas", target: "Residential", btu: 5.2 },
            { source: "Natural Gas", target: "Commercial", btu: 3.55 },
            { source: "Natural Gas", target: "Industrial", btu: 9.46 },
            { source: "Natural Gas", target: "Transportation", btu: 0.942 },
            { source: "Coal", target: "Electricity", btu: 16.4 },
            { source: "Coal", target: "Commercial", btu: 0.047 },
            { source: "Coal", target: "Industrial", btu: 1.51 },
            { source: "Biomass", target: "Electricity", btu: 0.507 },
            { source: "Biomass", target: "Residential", btu: 0.58 },
            { source: "Biomass", target: "Commercial", btu: 0.119 },
            { source: "Biomass", target: "Industrial", btu: 2.3 },
            { source: "Biomass", target: "Transportation", btu: 1.27 },
            { source: "Petroleum", target: "Electricity", btu: 0.294 },
            { source: "Petroleum", target: "Residential", btu: 0.945 },
            { source: "Petroleum", target: "Commercial", btu: 0.561 },
            { source: "Petroleum", target: "Industrial", btu: 8.16 },
            { source: "Petroleum", target: "Transportation", btu: 24.8 },
            { source: "Imports", target: "Electricity", btu: .164 },
            { source: "Electricity", target: "Wasted", btu: 25.8 },
            { source: "Electricity", target: "Residential", btu: 4.79 },
            { source: "Electricity", target: "Commercial", btu: 4.63 },
            { source: "Electricity", target: "Industrial", btu: 3.26 },
            { source: "Electricity", target: "Transportation", btu: 0.0265 },
            { source: "Residential", target: "Wasted", btu: 4.12 },
            { source: "Commercial", target: "Wasted", btu: 3.13 },
            { source: "Industrial", target: "Wasted", btu: 4.95 },
            { source: "Transportation", target: "Wasted", btu: 21.4 },
            { source: "Residential", target: "Useful", btu: 7.66 },
            { source: "Commercial", target: "Useful", btu: 5.81 },
            { source: "Industrial", target: "Useful", btu: 19.8 },
            { source: "Transportation", target: "Useful", btu: 5.68 },
        ]
    },
    2013: {
        nodes: [
            { name: "Solar", btu: 0.32 },
            { name: "Nuclear", btu: 8.27 },
            { name: "Hydro", btu: 2.56 },
            { name: "Wind", btu: 1.6 },
            { name: "Geothermal", btu: 0.201 },
            { name: "Natural Gas", btu: 26.6 },
            { name: "Coal", btu: 18},
            { name: "Biomass", btu: 4.49 },
            { name: "Petroleum", btu: 35.1 },
            { name: "Electricity", btu: 38.379 },
            { name: "Imports", btu: 0.179 },
            { name: "Residential", btu: 11.4 },
            { name: "Commercial", btu: 8.59 },
            { name: "Industrial", btu: 24.7 },
            { name: "Transportation", btu: 27.0 },
            { name: "Wasted", btu: 59 },
            { name: "Useful", btu: 38.4 },
            { name: "EXTRA NODE", btu: 99999 },  // Demonstrate node with no links is not rendered
        ], links: [
            { source: "Solar", target: "Electricity", btu: 0.0849 },
            { source: "Solar", target: "Residential", btu: 0.232 },
            { source: "Nuclear", target: "Electricity", btu: 8.27 },
            { source: "Hydro", target: "Electricity", btu: 2.53 },
            { source: "Hydro", target: "Industrial", btu: 0.032 },
            { source: "Wind", target: "Electricity", btu: 1.59 },
            { source: "Geothermal", target: "Electricity", btu: 0.157 },
            { source: "Geothermal", target: "Residential", btu: 0.0197 },
            { source: "Geothermal", target: "Commercial", btu: 0.0197 },
            { source: "Natural Gas", target: "Electricity", btu: 8.34 },
            { source: "Natural Gas", target: "Residential", btu: 5.05 },
            { source: "Natural Gas", target: "Commercial", btu: 3.36 },
            { source: "Natural Gas", target: "Industrial", btu: 9.08 },
            { source: "Natural Gas", target: "Transportation", btu: 0.795 },
            { source: "Coal", target: "Electricity", btu: 16.5 },
            { source: "Coal", target: "Commercial", btu: 0.0454 },
            { source: "Coal", target: "Industrial", btu: 1.5 },
            { source: "Biomass", target: "Electricity", btu: 0.465 },
            { source: "Biomass", target: "Residential", btu: 0.42 },
            { source: "Biomass", target: "Commercial", btu: 0.112 },
            { source: "Biomass", target: "Industrial", btu: 2.25 },
            { source: "Biomass", target: "Transportation", btu: 1.24 },
            { source: "Petroleum", target: "Electricity", btu: 0.262 },
            { source: "Petroleum", target: "Residential", btu: 0.893 },
            { source: "Petroleum", target: "Commercial", btu: 0.477 },
            { source: "Petroleum", target: "Industrial", btu: 8.58 },
            { source: "Petroleum", target: "Transportation", btu: 24.9 },
            { source: "Imports", target: "Electricity", btu: .179 },
            { source: "Electricity", target: "Wasted", btu: 25.8 },
            { source: "Electricity", target: "Residential", btu: 4.75 },
            { source: "Electricity", target: "Commercial", btu: 4.57 },
            { source: "Electricity", target: "Industrial", btu: 3.26 },
            { source: "Electricity", target: "Transportation", btu: 0.0257 },
            { source: "Residential", target: "Wasted", btu: 3.98 },
            { source: "Commercial", target: "Wasted", btu: 3.01 },
            { source: "Industrial", target: "Wasted", btu: 4.94 },
            { source: "Transportation", target: "Wasted", btu: 21.3 },
            { source: "Residential", target: "Useful", btu: 7.39 },
            { source: "Commercial", target: "Useful", btu: 5.58 },
            { source: "Industrial", target: "Useful", btu: 19.8 },
            { source: "Transportation", target: "Useful", btu: 5.66 },
        ]
    },
    2012: {
        nodes: [
            { name: "Solar", btu: 0.0408 },
            { name: "Nuclear", btu: 8.05 },
            { name: "Hydro", btu: 2.69 },
            { name: "Wind", btu: 1.36 },
            { name: "Geothermal", btu: 0.227 },
            { name: "Natural Gas", btu: 26 },
            { name: "Coal", btu: 17.4 },
            { name: "Biomass", btu: 4.32 },
            { name: "Petroleum", btu: 34.7 },
            { name: "Electricity", btu: 38.261 },
            { name: "Imports", btu: 0.161 },
            { name: "Residential", btu: 10.6 },
            { name: "Commercial", btu: 8.29 },
            { name: "Industrial", btu: 23.9 },
            { name: "Transportation", btu: 26.7 },
            { name: "Wasted", btu: 58.1 },
            { name: "Useful", btu: 37 },
            { name: "EXTRA NODE", btu: 99999 },  // Demonstrate node with no links is not rendered
        ], links: [
            { source: "Solar", target: "Electricity", btu: 0.0408 },
            { source: "Solar", target: "Residential", btu: 0.193 },
            { source: "Nuclear", target: "Electricity", btu: 8.05 },
            { source: "Hydro", target: "Electricity", btu: 2.67 },
            { source: "Hydro", target: "Industrial", btu: 0.018 },
            { source: "Wind", target: "Electricity", btu: 1.36 },
            { source: "Geothermal", target: "Electricity", btu: 0.163 },
            { source: "Geothermal", target: "Residential", btu: 0.0396 },
            { source: "Geothermal", target: "Commercial", btu: 0.0197 },
            { source: "Natural Gas", target: "Electricity", btu: 9.31 },
            { source: "Natural Gas", target: "Residential", btu: 4.26 },
            { source: "Natural Gas", target: "Commercial", btu: 2.96 },
            { source: "Natural Gas", target: "Industrial", btu: 8.7 },
            { source: "Natural Gas", target: "Transportation", btu: 0.764 },
            { source: "Coal", target: "Electricity", btu: 15.9 },
            { source: "Coal", target: "Commercial", btu: 0.0433 },
            { source: "Coal", target: "Industrial", btu: 1.48 },
            { source: "Biomass", target: "Electricity", btu: 0.429 },
            { source: "Biomass", target: "Residential", btu: 0.42 },
            { source: "Biomass", target: "Commercial", btu: 0.109 },
            { source: "Biomass", target: "Industrial", btu: 2.2 },
            { source: "Biomass", target: "Transportation", btu: 1.16 },
            { source: "Petroleum", target: "Electricity", btu: 0.218 },
            { source: "Petroleum", target: "Residential", btu: 1.02 },
            { source: "Petroleum", target: "Commercial", btu: 0.632 },
            { source: "Petroleum", target: "Industrial", btu: 8.12 },
            { source: "Petroleum", target: "Transportation", btu: 24.7 },
            { source: "Imports", target: "Electricity", btu: .161 },
            { source: "Electricity", target: "Wasted", btu: 25.7 },
            { source: "Electricity", target: "Residential", btu: 4.69 },
            { source: "Electricity", target: "Commercial", btu: 4.52 },
            { source: "Electricity", target: "Industrial", btu: 3.35 },
            { source: "Electricity", target: "Transportation", btu: 0.0256 },
            { source: "Residential", target: "Wasted", btu: 3.72 },
            { source: "Commercial", target: "Wasted", btu: 2.9 },
            { source: "Industrial", target: "Wasted", btu: 4.77 },
            { source: "Transportation", target: "Wasted", btu: 21.1 },
            { source: "Residential", target: "Useful", btu: 6.9 },
            { source: "Commercial", target: "Useful", btu: 5.39 },
            { source: "Industrial", target: "Useful", btu: 19.1 },
            { source: "Transportation", target: "Useful", btu: 5.6 },
        ]
    },
    2011: {
        nodes: [
            { name: "Solar", btu: 0.158 },
            { name: "Nuclear", btu: 8.26 },
            { name: "Hydro", btu: 3.17 },
            { name: "Wind", btu: 1.17 },
            { name: "Geothermal", btu: 0.226 },
            { name: "Natural Gas", btu: 24.9 },
            { name: "Coal", btu: 19.7 },
            { name: "Biomass", btu: 4.41 },
            { name: "Petroleum", btu: 35.3 },
            { name: "Electricity", btu: 39.327 },
            { name: "Imports", btu: 0.127 },
            { name: "Residential", btu: 11.4 },
            { name: "Commercial", btu: 8.59 },
            { name: "Industrial", btu: 23.6 },
            { name: "Transportation", btu: 27 },
            { name: "Wasted", btu: 55.6 },
            { name: "Useful", btu: 41.7 },
            { name: "EXTRA NODE", btu: 99999 },  // Demonstrate node with no links is not rendered
        ], links: [
            { source: "Solar", target: "Electricity", btu: 0.0175 },
            { source: "Solar", target: "Residential", btu: 0.14 },
            { source: "Nuclear", target: "Electricity", btu: 8.26 },
            { source: "Hydro", target: "Electricity", btu: 3.15 },
            { source: "Hydro", target: "Industrial", btu: 0.0179 },
            { source: "Wind", target: "Electricity", btu: 1.17 },
            { source: "Geothermal", target: "Electricity", btu: 0.163 },
            { source: "Geothermal", target: "Residential", btu: 0.0396 },
            { source: "Geothermal", target: "Commercial", btu: 0.0197 },
            { source: "Natural Gas", target: "Electricity", btu: 7.74 },
            { source: "Natural Gas", target: "Residential", btu: 4.83 },
            { source: "Natural Gas", target: "Commercial", btu: 3.23 },
            { source: "Natural Gas", target: "Industrial", btu: 8.32 },
            { source: "Natural Gas", target: "Transportation", btu: 0.735 },
            { source: "Coal", target: "Electricity", btu: 18 },
            { source: "Coal", target: "Commercial", btu: 0.0512 },
            { source: "Coal", target: "Industrial", btu: 1.61 },
            { source: "Biomass", target: "Electricity", btu: 0.444 },
            { source: "Biomass", target: "Residential", btu: 0.43 },
            { source: "Biomass", target: "Commercial", btu: 0.11 },
            { source: "Biomass", target: "Industrial", btu: 2.27 },
            { source: "Biomass", target: "Transportation", btu: 1.15 },
            { source: "Petroleum", target: "Electricity", btu: 0.288 },
            { source: "Petroleum", target: "Residential", btu: 1.14 },
            { source: "Petroleum", target: "Commercial", btu: 0.683 },
            { source: "Petroleum", target: "Industrial", btu: 8.06 },
            { source: "Petroleum", target: "Transportation", btu: 25.1 },
            { source: "Imports", target: "Electricity", btu: .127 },
            { source: "Electricity", target: "Wasted", btu: 26.6 },
            { source: "Electricity", target: "Residential", btu: 4.86 },
            { source: "Electricity", target: "Commercial", btu: 4.5 },
            { source: "Electricity", target: "Industrial", btu: 3.33 },
            { source: "Electricity", target: "Transportation", btu: 0.026 },
            { source: "Residential", target: "Wasted", btu: 2.29 },
            { source: "Commercial", target: "Wasted", btu: 1.72 },
            { source: "Industrial", target: "Wasted", btu: 4.72 },
            { source: "Transportation", target: "Wasted", btu: 20.3 },
            { source: "Residential", target: "Useful", btu: 9.15 },
            { source: "Commercial", target: "Useful", btu: 6.87 },
            { source: "Industrial", target: "Useful", btu: 18.9 },
            { source: "Transportation", target: "Useful", btu: 6.76 },
        ]
    },
    2010: {
        nodes: [
            { name: "Solar", btu: 0.13 },
            { name: "Nuclear", btu: 8.4 },
            { name: "Hydro", btu: 2.5 },
            { name: "Wind", btu: 0.92 },
            { name: "Geothermal", btu: 0.210 },
            { name: "Natural Gas", btu: 25 },
            { name: "Coal", btu: 21 },
            { name: "Biomass", btu: 3.5 },
            { name: "Petroleum", btu: 36 },
            { name: "Electricity", btu: 40.029 },
            { name: "Imports", btu: 0.029 },
            { name: "Residential", btu: 12 },
            { name: "Commercial", btu: 8.5 },
            { name: "Industrial", btu: 24 },
            { name: "Transportation", btu: 27 },
            { name: "Wasted", btu: 60 },
            { name: "Useful", btu: 38 },
            { name: "EXTRA NODE", btu: 99999 },  // Demonstrate node with no links is not rendered
        ], links: [
            { source: "Solar", target: "Electricity", btu: 0.012 },
            { source: "Solar", target: "Residential", btu: 0.110 },
            { source: "Nuclear", target: "Electricity", btu: 8.4 },
            { source: "Hydro", target: "Electricity", btu: 2.5 },
            { source: "Hydro", target: "Commercial", btu: .79 },
            { source: "Hydro", target: "Industrial", btu: 0.016 },
            { source: "Wind", target: "Electricity", btu: 0.92 },
            { source: "Geothermal", target: "Electricity", btu: 0.15 },
            { source: "Geothermal", target: "Residential", btu: 0.037 },
            { source: "Geothermal", target: "Commercial", btu: 0.019 },
            { source: "Geothermal", target: "Industrial", btu: 0.0042 },
            { source: "Natural Gas", target: "Electricity", btu: 7.6 },
            { source: "Natural Gas", target: "Residential", btu: 4.9 },
            { source: "Natural Gas", target: "Commercial", btu: 3.2 },
            { source: "Natural Gas", target: "Industrial", btu: 8.3 },
            { source: "Natural Gas", target: "Transportation", btu: 0.72 },
            { source: "Coal", target: "Electricity", btu: 19 },
            { source: "Coal", target: "Commercial", btu: 0.07 },
            { source: "Coal", target: "Industrial", btu: 1.6 },
            { source: "Biomass", target: "Electricity", btu: 0.46 },
            { source: "Biomass", target: "Residential", btu: 0.44 },
            { source: "Biomass", target: "Commercial", btu: 0.11 },
            { source: "Biomass", target: "Industrial", btu: 1.5 },
            { source: "Biomass", target: "Transportation", btu: 1 },
            { source: "Petroleum", target: "Electricity", btu: 0.38 },
            { source: "Petroleum", target: "Residential", btu: 1.1 },
            { source: "Petroleum", target: "Commercial", btu: 0.65 },
            { source: "Petroleum", target: "Industrial", btu: 8.2 },
            { source: "Petroleum", target: "Transportation", btu: 26 },
            { source: "Imports", target: "Electricity", btu: 0.029 },
            { source: "Electricity", target: "Wasted", btu: 27 },
            { source: "Electricity", target: "Residential", btu: 4.9 },
            { source: "Electricity", target: "Commercial", btu: 4.5 },
            { source: "Electricity", target: "Industrial", btu: 3.33 },
            { source: "Electricity", target: "Transportation", btu: 0.026 },
            { source: "Residential", target: "Wasted", btu: 4 },
            { source: "Commercial", target: "Wasted", btu: 3 },
            { source: "Industrial", target: "Wasted", btu: 4.7 },
            { source: "Transportation", target: "Wasted", btu: 22 },
            { source: "Residential", target: "Useful", btu: 7.5 },
            { source: "Commercial", target: "Useful", btu: 5.6 },
            { source: "Industrial", target: "Useful", btu: 19 },
            { source: "Transportation", target: "Useful", btu: 5.8 },
        ]
    },
    2009: {
        nodes: [
            { name: "Solar", btu: 0.32 },
            { name: "Nuclear", btu: 8.27 },
            { name: "Hydro", btu: 2.56 },
            { name: "Wind", btu: 1.6 },
            { name: "Geothermal", btu: 0.201 },
            { name: "Natural Gas", btu: 26.6 },
            { name: "Coal", btu: 18 },
            { name: "Biomass", btu: 4.49 },
            { name: "Petroleum", btu: 35.1 },
            { name: "Electricity", btu: 38.379 },
            { name: "Imports", btu: 0.179 },
            { name: "Residential", btu: 11.4 },
            { name: "Commercial", btu: 8.59 },
            { name: "Industrial", btu: 24.7 },
            { name: "Transportation", btu: 27 },
            { name: "Wasted", btu: 59 },
            { name: "Useful", btu: 38.4 },
            { name: "EXTRA NODE", btu: 99999 },  // Demonstrate node with no links is not rendered
        ], links: [
            { source: "Solar", target: "Electricity", btu: 0.0849 },
            { source: "Solar", target: "Residential", btu: 0.232 },
            { source: "Nuclear", target: "Electricity", btu: 8.27 },
            { source: "Hydro", target: "Electricity", btu: 2.53 },
            { source: "Hydro", target: "Industrial", btu: 0.032 },
            { source: "Wind", target: "Electricity", btu: 1.59 },
            { source: "Geothermal", target: "Electricity", btu: 0.157 },
            { source: "Geothermal", target: "Residential", btu: 0.0197 },
            { source: "Geothermal", target: "Commercial", btu: 0.0197 },
            { source: "Natural Gas", target: "Electricity", btu: 8.34 },
            { source: "Natural Gas", target: "Residential", btu: 5.05 },
            { source: "Natural Gas", target: "Commercial", btu: 3.36 },
            { source: "Natural Gas", target: "Industrial", btu: 9.08 },
            { source: "Natural Gas", target: "Transportation", btu: 0.795 },
            { source: "Coal", target: "Electricity", btu: 16.5 },
            { source: "Coal", target: "Commercial", btu: 0.0454 },
            { source: "Coal", target: "Industrial", btu: 1.5 },
            { source: "Biomass", target: "Electricity", btu: 0.465 },
            { source: "Biomass", target: "Residential", btu: 0.42 },
            { source: "Biomass", target: "Commercial", btu: 0.112 },
            { source: "Biomass", target: "Industrial", btu: 2.25 },
            { source: "Biomass", target: "Transportation", btu: 1.24 },
            { source: "Petroleum", target: "Electricity", btu: 0.262 },
            { source: "Petroleum", target: "Residential", btu: 0.893 },
            { source: "Petroleum", target: "Commercial", btu: 0.477 },
            { source: "Petroleum", target: "Industrial", btu: 8.58 },
            { source: "Petroleum", target: "Transportation", btu: 24.9 },
            { source: "Imports", target: "Electricity", btu: 0.179 },
            { source: "Electricity", target: "Wasted", btu: 25.8 },
            { source: "Electricity", target: "Residential", btu: 4.75 },
            { source: "Electricity", target: "Commercial", btu: 4.57 },
            { source: "Electricity", target: "Industrial", btu: 3.26 },
            { source: "Electricity", target: "Transportation", btu: 0.0257 },
            { source: "Residential", target: "Wasted", btu: 3.98 },
            { source: "Commercial", target: "Wasted", btu: 3.01 },
            { source: "Industrial", target: "Wasted", btu: 4.94 },
            { source: "Transportation", target: "Wasted", btu: 21.3 },
            { source: "Residential", target: "Useful", btu: 7.39 },
            { source: "Commercial", target: "Useful", btu: 5.58 },
            { source: "Industrial", target: "Useful", btu: 19.8 },
            { source: "Transportation", target: "Useful", btu: 5.66 },
        ]
    },
    2008: {
        nodes: [
            { name: "Solar", btu: 0.09 },
            { name: "Nuclear", btu: 8.45 },
            { name: "Hydro", btu: 2.45 },
            { name: "Wind", btu: 0.51 },
            { name: "Geothermal", btu: 0.35 },
            { name: "Natural Gas", btu: 23.84 },
            { name: "Coal", btu: 22.42 },
            { name: "Biomass", btu: 3.88 },
            { name: "Petroleum", btu: 37.13 },
            { name: "Electricity", btu: 40.08 },
            { name: "Imports", btu: 0.11 },
            { name: "Residential", btu: 11.48 },
            { name: "Commercial", btu: 8.58 },
            { name: "Industrial", btu: 23.94 },
            { name: "Transportation", btu: 27.86 },
            { name: "Wasted", btu: 57.07 },
            { name: "Useful", btu: 42.15 },
            { name: "EXTRA NODE", btu: 99999 },  // Demonstrate node with no links is not rendered
        ], links: [
            { source: "Solar", target: "Electricity", btu: 0.01 },
            { source: "Solar", target: "Residential", btu: 0.08 },
            { source: "Nuclear", target: "Electricity", btu: 8.45 },
            { source: "Hydro", target: "Electricity", btu: 2.43 },
            { source: "Hydro", target: "Industrial", btu: 0.01 },
            { source: "Wind", target: "Electricity", btu: 0.51 },
            { source: "Geothermal", target: "Electricity", btu: 0.31 },
            { source: "Geothermal", target: "Residential", btu: 0.02 },
            { source: "Geothermal", target: "Commercial", btu: 0.01 },
            { source: "Natural Gas", target: "Electricity", btu: 6.82 },
            { source: "Natural Gas", target: "Residential", btu: 4.99 },
            { source: "Natural Gas", target: "Commercial", btu: 3.2 },
            { source: "Natural Gas", target: "Industrial", btu: 8.14 },
            { source: "Natural Gas", target: "Transportation", btu: 0.67 },
            { source: "Coal", target: "Electricity", btu: 20.54 },
            { source: "Coal", target: "Commercial", btu: 0.06 },
            { source: "Coal", target: "Industrial", btu: 1.79 },
            { source: "Biomass", target: "Electricity", btu: 0.42 },
            { source: "Biomass", target: "Residential", btu: 0.49 },
            { source: "Biomass", target: "Commercial", btu: 0.1 },
            { source: "Biomass", target: "Industrial", btu: 2.03 },
            { source: "Biomass", target: "Transportation", btu: 0.83 },
            { source: "Petroleum", target: "Electricity", btu: 0.46 },
            { source: "Petroleum", target: "Residential", btu: 1.17 },
            { source: "Petroleum", target: "Commercial", btu: 0.57 },
            { source: "Petroleum", target: "Industrial", btu: 8.58 },
            { source: "Petroleum", target: "Transportation", btu: 26.33 },
            { source: "Imports", target: "Electricity", btu: 0.11 },
            { source: "Electricity", target: "Wasted", btu: 27.39 },
            { source: "Electricity", target: "Residential", btu: 4.7 },
            { source: "Electricity", target: "Commercial", btu: 4.61 },
            { source: "Electricity", target: "Industrial", btu: 3.35 },
            { source: "Electricity", target: "Transportation", btu: 0.02 },
            { source: "Residential", target: "Wasted", btu: 2.29 },
            { source: "Commercial", target: "Wasted", btu: 1.71 },
            { source: "Industrial", target: "Wasted", btu: 4.78 },
            { source: "Transportation", target: "Wasted", btu: 20.9 },
            { source: "Residential", target: "Useful", btu: 9.18 },
            { source: "Commercial", target: "Useful", btu: 6.86 },
            { source: "Industrial", target: "Useful", btu: 19.15 },
            { source: "Transportation", target: "Useful", btu: 6.96 },
        ]
    },
};

// Render the Sankey Flow Graph with US energy data
us_sankey.render({ data: us_energy_data[2014].nodes, links: us_energy_data[2014].links });

// ### Structure for UK energy data

// Structure for UK energy nodes
// just contain a `name` of the node
interface UKEnergyData {
    name: string;
}
// Structure for UK links between nodes.
// `source` index of the energy node for the source side of this link.
// `target` index of the energy node for the target side of this link.
// `value` of the energy flow through this link.
interface UKEnergyLink {
    source: number;
    target: number;
    value: number;
}

// ### UK Energy Data from the UK Dept of Energy & Climate Change

var uk_energy_data = {
    nodes: [
        { "name": "Agricultural 'waste'" },
        { "name": "Bio-conversion" },
        { "name": "Liquid" },
        { "name": "Losses" },
        { "name": "Solid" },
        { "name": "Gas" }, // 5
        { "name": "Biofuel imports" },
        { "name": "Biomass imports" },
        { "name": "Coal imports" },
        { "name": "Coal" },
        { "name": "Coal reserves" },
        { "name": "District heating" },
        { "name": "Industry" },
        { "name": "Heating and cooling - commercial" },
        { "name": "Heating and cooling - homes" },
        { "name": "Electricity grid" }, // 15
        { "name": "Over generation / exports" },
        { "name": "H2 conversion" },
        { "name": "Road transport" },
        { "name": "Agriculture" },
        { "name": "Rail transport" },
        { "name": "Lighting & appliances - commercial" },
        { "name": "Lighting & appliances - homes" },
        { "name": "Gas imports" },
        { "name": "Ngas" }, // 24
        { "name": "Gas reserves" },
        { "name": "Thermal generation" },
        { "name": "Geothermal" },
        { "name": "H2" },
        { "name": "Hydro" },
        { "name": "International shipping" },
        { "name": "Domestic aviation" },
        { "name": "International aviation" },
        { "name": "National navigation" },
        { "name": "Marine algae" },
        { "name": "Nuclear" },
        { "name": "Oil imports" },
        { "name": "Oil" }, // 37
        { "name": "Oil reserves" },
        { "name": "Other waste" },
        { "name": "Pumped heat" },
        { "name": "Solar PV" },
        { "name": "Solar Thermal" },
        { "name": "Solar" },
        { "name": "Tidal" },
        { "name": "UK land based bioenergy" },
        { "name": "Wave" },
        { "name": "Wind" }
    ],
    links: [
        { "source": 0, "target": 1, "value": 124.729 },
        { "source": 1, "target": 2, "value": 0.597 },
        { "source": 1, "target": 3, "value": 26.862 },
        { "source": 1, "target": 4, "value": 280.322 },
        { "source": 1, "target": 5, "value": 81.144 },
        { "source": 6, "target": 2, "value": 35 },
        { "source": 7, "target": 4, "value": 35 },
        { "source": 8, "target": 9, "value": 11.606 },
        { "source": 10, "target": 9, "value": 63.965 },
        { "source": 9, "target": 4, "value": 75.571 },
        { "source": 11, "target": 12, "value": 10.639 },
        { "source": 11, "target": 13, "value": 22.505 },
        { "source": 11, "target": 14, "value": 46.184 },
        { "source": 15, "target": 16, "value": 104.453 },
        { "source": 15, "target": 14, "value": 113.726 },
        { "source": 15, "target": 17, "value": 27.14 },
        { "source": 15, "target": 12, "value": 342.165 },
        { "source": 15, "target": 18, "value": 37.797 },
        { "source": 15, "target": 19, "value": 4.412 },
        { "source": 15, "target": 13, "value": 40.858 },
        { "source": 15, "target": 3, "value": 56.691 },
        { "source": 15, "target": 20, "value": 7.863 },
        { "source": 15, "target": 21, "value": 90.008 },
        { "source": 15, "target": 22, "value": 93.494 },
        { "source": 23, "target": 24, "value": 40.719 },
        { "source": 25, "target": 24, "value": 82.233 },
        { "source": 5, "target": 13, "value": 0.129 },
        { "source": 5, "target": 3, "value": 1.401 },
        { "source": 5, "target": 26, "value": 151.891 },
        { "source": 5, "target": 19, "value": 2.096 },
        { "source": 5, "target": 12, "value": 48.58 },
        { "source": 27, "target": 15, "value": 7.013 },
        { "source": 17, "target": 28, "value": 20.897 },
        { "source": 17, "target": 3, "value": 6.242 },
        { "source": 28, "target": 18, "value": 20.897 },
        { "source": 29, "target": 15, "value": 6.995 },
        { "source": 2, "target": 12, "value": 121.066 },
        { "source": 2, "target": 30, "value": 128.69 },
        { "source": 2, "target": 18, "value": 135.835 },
        { "source": 2, "target": 31, "value": 14.458 },
        { "source": 2, "target": 32, "value": 206.267 },
        { "source": 2, "target": 19, "value": 3.64 },
        { "source": 2, "target": 33, "value": 33.218 },
        { "source": 2, "target": 20, "value": 4.413 },
        { "source": 34, "target": 1, "value": 4.375 },
        { "source": 24, "target": 5, "value": 122.952 },
        { "source": 35, "target": 26, "value": 839.978 },
        { "source": 36, "target": 37, "value": 504.287 },
        { "source": 38, "target": 37, "value": 107.703 },
        { "source": 37, "target": 2, "value": 611.99 },
        { "source": 39, "target": 4, "value": 56.587 },
        { "source": 39, "target": 1, "value": 77.81 },
        { "source": 40, "target": 14, "value": 193.026 },
        { "source": 40, "target": 13, "value": 70.672 },
        { "source": 41, "target": 15, "value": 59.901 },
        { "source": 42, "target": 14, "value": 19.263 },
        { "source": 43, "target": 42, "value": 19.263 },
        { "source": 43, "target": 41, "value": 59.901 },
        { "source": 4, "target": 19, "value": 0.882 },
        { "source": 4, "target": 26, "value": 400.12 },
        { "source": 4, "target": 12, "value": 46.477 },
        { "source": 26, "target": 15, "value": 525.531 },
        { "source": 26, "target": 3, "value": 787.129 },
        { "source": 26, "target": 11, "value": 79.329 },
        { "source": 44, "target": 15, "value": 9.452 },
        { "source": 45, "target": 1, "value": 182.01 },
        { "source": 46, "target": 15, "value": 19.013 },
        { "source": 47, "target": 15, "value": 289.366 },
    ]
};

// **Cycles / Backedges** - _Made up data_
var uk_energy_data_backedges = [
    { "source": 11, "target": 26, "value": 80 },
];


// Render the Sankey Flow Graph with UK energy data
uk_sankey.render({
    data: uk_energy_data.nodes,
    links: d3.merge([uk_energy_data.links, uk_energy_data_backedges]),
});
