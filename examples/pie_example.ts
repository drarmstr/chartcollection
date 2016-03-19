// # C3 Pie Charts
// _Demonstrate Pie charts._


// ## Prepare the Data
// A function to generate random data.  Construct an array which contains objects that have 
// `x` and `y` members.
type PolarPlotDatum = { id: number, value: number, radius: number, height: number, color:string }
var random_polar_data: PolarPlotDatum[] = [];
var radial_line_values = [0.25, 0.666];

var polar_data_color = d3.scale.category10();
function generate_polar_data() {
    random_polar_data.length = 0;
    for (let i = 0; i < 10; i++) {
        random_polar_data.push({
            id: i,
            value: 10 * Math.random(),
            radius: 7 * Math.random(),
            height: 3 * Math.random(),
            color: polar_data_color(i.toString()).toString(),
        });
    }
}
// Generate initial dataset.
generate_polar_data();

// ## Create a **Pie Chart**
var pie_chart_layer: c3.Polar.Layer.Pie<PolarPlotDatum>;
var pie_chart = new c3.Polar<PolarPlotDatum>({
    anchor: '#pie_example_chart',
    width: 300,
    height: 300,

    data: random_polar_data,

    // Create a single **pie chart** layer
    layers: [
        pie_chart_layer = new c3.Polar.Layer.Pie<PolarPlotDatum>({
            // A key is necessary for pie charts
            key: (d) => d.id,
            value: (d) => d.value,
            sort: false,

            // Set an `inner_radius` to create a "donut chart"
            // These could also be callbacks
            inner_radius: 0.2,
            outer_radius: 0.8,
            pad: 0.01,

            // Style the pie chart arc segments
            arc_options: {
                // Tooltip with just the value, and color based on the data
                title: (d) => d.value,
                styles: {
                    'fill': (d) => d.color,
                },

                // Enable the segments to **animate** when data is changed with a redraw
                animate: true,
                duration: 4000,

                // Have the segments slide out slightly when hovering over them
                events: {
                    'mouseenter': function () {
                        d3.select(this).transition('grow').attr('transform', 'scale(1.2)');
                    },
                    'mouseleave': function () {
                        d3.select(this).transition('grow').attr('transform', 'scale(1)');
                    },
                },
            },

            // If the data is sorted _and_ the elements are limited, then this creates
            // an arc segment for the range of the _other_ values of the ellided data.
            other_options: {
                title: (d) => "Other",
                styles: {
                    'fill': 'black',
                    'opacity': 0.5,
                    'stroke': 'black',
                    'stroke-width': 2,
                    'stroke-dasharray': '5,5',
                },
                animate: true,
            },
        }),
    ],
}).render();


// ## Create a Polar Segment Chart
var polar_segment_chart = new c3.Polar<PolarPlotDatum>({
    anchor: '#polar_segment_example_chart',
    width: 300,
    height: 300,

    // Use the same data array for this layer
    data: random_polar_data,

    // Setup angular and radial scales to go from 0-10
    t: d3.scale.linear().domain([0, 10]),
    r: d3.scale.linear().domain([0, 10]),
    zoomable: true,

    layers: [
        // Create a single **Arc** segment layer
        new c3.Polar.Layer.Arc<PolarPlotDatum>({
            key: (d) => d.id,
            value: (d) => d.value,

            // Arc segments layers can define the radius and angle extents of the segment region.
            inner_radius: (d) => d.radius,
            outer_radius: (d) => d.radius + d.height,
            start_angle: (d) => d.id,
            end_angle: (d) => d.id + (d.value / 5),

            // Style and animate the arc segments
            arc_options: {
                title: (d) => d.value,
                styles: {
                    'fill': (d) => d.color,
                },
                animate: true,
                duration: 4000,
            },
        }),
    ],
}).render();


// ## Create a Half-moon Pie Chart
var half_moon_chart = new c3.Polar<PolarPlotDatum>({
    anchor: '#half_moon_example_chart',
    width: 600,
    height: 600,

    data: random_polar_data,

    // Setup the angular range from -π/2 to π/2 to create a "half moon" effect.
    angular_range: [-Math.PI/2, Math.PI/2],
    zoomable: true,

    layers: [
        new c3.Polar.Layer.Pie<PolarPlotDatum>({
            key: (d) => d.id,
            value: (d) => d.value,
            sort: false,

            // Create a half-ring with these radius
            inner_radius: 0.6,
            outer_radius: 0.9,
            pad: 0.015,

            arc_options: {
                // Style the arc segments
                title: (d) => d.value,
                styles: {
                    'fill': (d) => d.color,
                },

                // Animate arc segments when they move due to `redraw()`
                animate: true,
                duration: 4000,

                // Animate arc segments sliding out when hovering just for fun.
                events: {
                    'mouseenter': function () {
                        d3.select(this).transition().attr('transform', 'scale(1.1)');
                    },
                    'mouseleave': function () {
                        d3.select(this).transition().attr('transform', 'scale(1)');
                    },
                },
            },

            // Create an arch segment for "other" data that was decimated due to sorting and limiting the 
            // segment count with `limit_elements` and `sort`.
            other_options: {
                title: (d) => "Other",
                styles: {
                    'fill': 'black',
                    'opacity': 0.5,
                    'stroke': 'black',
                    'stroke-width': 2,
                    'stroke-dasharray': '5,5',
                },
                animate: true,
            },
        }),

        // Create a second layer to demonstrate composability.
        // This layer is just a thin band of three segments
        new c3.Polar.Layer.Pie<number>({
            key: (d) => d,
            value: (d) => d,
            inner_radius: 0.55,
            outer_radius: 0.5,
            pad: 0.015,

            data: [3, 2, 1],

            // Style the segments to be red, green, and blue respectively.
            arc_options: {
                title: "Example extra data layer",
                styles: {
                    'fill': (d,i) => ['red','green','blue'][i],
                },
            },
        }),

        // Create a third layer of **radial** line vectors.
        new c3.Polar.Layer.Radial<number>({
            value: (d) => d,

            // Use a global array for the data so it can be shared with the legend
            data: radial_line_values,

            // Allow the lines to be **draggable**
            draggable: true,

            // Draw one vector with an infinite length and the other with the full radius of 1
            outer_radius: (d,i) => i ? 1 : Infinity,

            // Style one line in red and the other in green.
            line_options: {
                styles: {
                    'stroke': (d, i) => ['red','green'][i],
                    'stroke-dasharray': '10,5',
                    'stroke-width': 3,
                },
            },

            handlers: {
                // When the lines are dragged, update the original data array and sync with the
                // legend by redrawing it.
                drag: (value, d, i) => {
                    radial_line_values[i] = value;
                    radial_line_values_legend.redraw();
                },
                // Redraw layer so it binds the updated values.
                // This wouldn't be necessary if we were just modifying an Object in-place in the data array.
                dragend: function (value, d, i) { this.redraw(); },
            },
        }),
    ],
}).render();

// ## Legend for radial vectors

// Create a **legend** for the current values of the radial lines
var radial_line_values_legend = new c3.Legend<number, void>({
    anchor: '#line_values_legend',

    data: radial_line_values,

    // Display the value as a truncated integer percentage 
    item_options: {
        text: (d) => ((d*100)|0)+'%',
    },

    // Use a matching colored swatch for the legend bullets
    bullet_options: {
        html: '',
        styles: {
            'background': (d, i) => ['red', 'green'][i],
            'height': '1em',
            'width': '1em',
            'border-radius': '0.25em',
        },
    },
}).render();

// ## Forms to modify chart options

// Allow the user generate new data by clicking on a button.  We need to `redraw()` the charts
// to reflect the updated data.  _Note_: if we had cleared random_data via: `random_data = []`
// in the `generate_data()` function, then this wouldn't work.  It would just have updated the
// variable and not the array that the charts are working with.  That's why `random_data.length=0` is used.
$('#sync_generate_button').on('click', () => {
    generate_polar_data();
    pie_chart.redraw();
    half_moon_chart.redraw();
    polar_segment_chart.redraw();
});

// Enable animations when transitioning datasets
$('#enable_animations').on('change', function () {
    (<c3.Polar.Layer.Pie<any>>pie_chart.layers[0]).arc_options.animate = this.checked;
    (<c3.Polar.Layer.Pie<any>>half_moon_chart.layers[0]).arc_options.animate = this.checked;
    (<c3.Polar.Layer.Pie<any>>polar_segment_chart.layers[0]).arc_options.animate = this.checked;
});

// Enable sorting pie wedges
$('#enable_sorting').on('change', function () {
    (<c3.Polar.Layer.Pie<any>>pie_chart.layers[0]).sort = this.checked;
    pie_chart.redraw();
    (<c3.Polar.Layer.Pie<any>>half_moon_chart.layers[0]).sort = this.checked;
    half_moon_chart.redraw();
});

// Limit the number of elements that will be drawn.
// If there are too many elements, then the ones with the smallest value won't be drawn.
for (let event_name of ['input', 'change']) { // 'input' event is not supported in IE
    $('#limit_segment_count').on(event_name, function () {
        (<c3.Polar.Layer.Pie<any>>pie_chart.layers[0]).limit_elements = +$(this).val();
        pie_chart.redraw();
        (<c3.Polar.Layer.Pie<any>>half_moon_chart.layers[0]).limit_elements = +$(this).val();
        half_moon_chart.redraw();
        (<c3.Polar.Layer.Arc<any>>polar_segment_chart.layers[0]).limit_elements = +$(this).val();
        polar_segment_chart.redraw();
    });
}