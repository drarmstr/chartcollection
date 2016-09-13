// ## C3 Swimlane Timelines
// _Demonstrate how to create timelines with swimlanes._

type SwimlaneDatum = {
    swimlane: number
    time: number
    duration: number
    color: string
}

// ## Prepare the Segment Data
// A function to generate random swimlane data
function generate_segment_data(data: SwimlaneDatum[]) {
    data.length = 0;
    let color_scale = d3.scale.category10();
    let color = color_scale('seed');
    for (let swimlane = 0; swimlane < 4; swimlane++)
        for (let time = Math.random()*5; time < 100; time += Math.random() * 15) {
            let duration = Math.random() * 15;
            if (Math.random() > 0.75)
                color = color_scale(Math.random().toString());
            data.push({
                swimlane: swimlane,
                time: time,
                duration: time + duration > 100 ? 100 - time : duration,
                color: color,
            });
            time += duration;
        }
    c3.array.sort_up(data, (d) => d.time);
}


// ## Create the Segment Swimlane Chart

// Create a `c3.Plot` chart.
var segment_layer: c3.Plot.Layer.Swimlane.Segment<SwimlaneDatum>;
var swimlane_timeline = new c3.Plot.Zoomable<SwimlaneDatum>({
    anchor: '#swimlanes_segment_plot',
    width: '95%',
    height: 300,
    zoomable: 'h',

    data: [],
    
    // Setup the **scales** to go from 0-100 horizontally and 4 swimlanes vertically.
    h: d3.scale.linear().domain([0, 100]),
    v: d3.scale.linear().domain([0, 4]),
    
    // Add an **x axis** with grid lines.
    axes: [
        new c3.Axis.X({
            grid: true,
            ticks: false,
        }),
    ],
    
    layers: [
        // Add a _segment swimlane_ *layer*
        segment_layer = new c3.Plot.Layer.Swimlane.Segment<SwimlaneDatum>({
            // Accessor functions which describe how to get **x**, **dx** and **y** values from the data elements.
            x: (d) => d.time,
            dx: (d) => d.duration,
            y: (d) => d.swimlane,

            rect_options: {
                // Static styles are more efficiently handled in a CSS file, this is just an example.
                styles: {
                    'fill': (d) => d.color,
                    'stroke': (d) => d3.rgb(d.color).darker().toString(),
                    'stroke-width': 2,
                    'rx': 5, // rounded corners (Doesn't work in IE11)
                    '-webkit-transform': 'scale(1,0.75)', // (Doesn't work in IE11)
                    '-webkit-transform-origin': 'center', // (Doesn't work in Firefox)
                    'shape-rendering': 'geometricPrecision',
                },
            },

            // Create **lables** for each segment
            label_options: {
                text: (d) => Math.round(d.duration),
                styles: {
                    'font-weight': 'bold',
                    'text-shadow': (d)=> '1px 1px 1px '+d3.rgb(d.color).brighter().toString(),
                },
            },

            // An HTML tooltip
            hover: (d) => d ? Math.round(d.duration) : null,

            // Add a border between swimlanes
            lane_options: {
                styles: {
                    'fill': 'none',
                    'stroke': 'gray',
                },
            },
        }),
    ],
});


// ## Create the Sampled Swimlane Charts

// Create a `c3.Plot` chart.
var sampled_svg_timeline = new c3.Plot.Zoomable<SwimlaneDatum>({
    anchor: '#swimlanes_sampled_svg_plot',
    width: '95%',
    height: 300,
    zoomable: 'h',

    data: [],
    
    // Setup the **scales** to go from 0-100 horizontally and 4 swimlanes vertically.
    h: d3.scale.linear().domain([0, 100]),
    v: d3.scale.linear().domain([0, 4]),
    
    // Add an **x axis** with grid lines.
    axes: [
        new c3.Axis.X({
            grid: true,
            ticks: false,
        }),
    ],

    margins: { bottom: 20 },

    layers: [
        // Add a _sampled swimlane_ *layer*
        new c3.Plot.Layer.Swimlane.Sampled.SVG<SwimlaneDatum>({
            // Accessor functions which describe how to get **x**, **dx** and **y** values from the data elements.
            x: (d) => d.time,
            dx: (d) => d.duration,
            y: (d) => d.swimlane,

            line_options: {
                title: (d) => Math.round(d.duration),
                styles: {
                    'stroke': (d) => d.color,
                },
            },

            // Add a border between swimlanes
            lane_options: {
                styles: {
                    'fill': 'none',
                    'stroke': 'gray',
                },
            },
        }),
    ],
});


var sampled_canvas_timeline = new c3.Plot.Zoomable<SwimlaneDatum>({
    anchor: '#swimlanes_sampled_canvas_plot',
    width: '95%',
    height: 300,
    zoomable: 'h',

    data: [],
    
    // Setup the **scales** to go from 0-100 horizontally and 4 swimlanes vertically.
    h: d3.scale.linear().domain([0, 100]),
    v: d3.scale.linear().domain([0, 4]),
    
    // Add an **x axis** with grid lines.
    axes: [
        new c3.Axis.X({
            grid: true,
            ticks: false,
        }),
    ],

    layers: [
        // Add a _sampled swimlane_ *layer*
        new c3.Plot.Layer.Swimlane.Sampled.Canvas<SwimlaneDatum>({
            // Accessor functions which describe how to get **x**, **dx** and **y** values from the data elements.
            x: (d) => d.time,
            dx: (d) => d.duration,
            y: (d) => d.swimlane,
            safe: false,

            line_options: {
                styles: {
                    'stroke': (d) => d.color,
                },
            },

            // Add a border between swimlanes
            lane_options: {
                styles: {
                    'fill': 'none',
                    'stroke': 'gray',
                },
            },

            // HTML tooltip
            hover: (d) => d ? Math.round(d.duration) : null,
        }),
    ],
});


// ## Render the Charts

// Generate initial data
generate_segment_data(swimlane_timeline.data);
sampled_svg_timeline.data = swimlane_timeline.data;
sampled_canvas_timeline.data = swimlane_timeline.data;

// Call `render()` on the charts to initially render them.
swimlane_timeline.render();
sampled_svg_timeline.render();
sampled_canvas_timeline.render();

// Allow the user generate new data by clicking on a button.  We need to `redraw()` the charts
// to reflect the updated data.  _Note_: if we had cleared random_data via: `random_data = []`
// in the `generate_data()` function, then this wouldn't work.  It would just have updated the
// variable and not the array that the charts are working with.  That's why `random_data.length=0` is used.
$('#sync_generate_button').on('click', () => {
    generate_segment_data(swimlane_timeline.data);
    swimlane_timeline.redraw();
    sampled_svg_timeline.redraw();
    sampled_canvas_timeline.redraw();
});

// Set the chart to limit the number of segments rendered.  Note that it will prioritize drawing the
// longest segments first.
$('#limit_segments').on('change', function () {
    if (this.checked) {
        $('#limit_segment_count').prop('disabled', false);
        segment_layer.limit_elements = +$('#limit_segment_count').val();
    } else {
        $('#limit_segment_count').prop('disabled', true);
        segment_layer.limit_elements = null;
    }
    swimlane_timeline.redraw();
});

// Adjust the number of elements to limit as the slider is changed.
// The `input` event not supported in IE
for (var event_name of ['input', 'change']) {
    $('#limit_segment_count').on(event_name, function () {
        segment_layer.limit_elements = +$(this).val();
        swimlane_timeline.redraw();
    });
}

// Resize the chart to fit the window
window.onresize = () => {
    swimlane_timeline.resize();
    sampled_svg_timeline.resize();
    sampled_canvas_timeline.resize();
}
