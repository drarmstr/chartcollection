// # C3 Pie Charts
// _Demonstrate Pie charts._
var random_polar_data = [];
var radial_line_values = [0.25, 0.666];
var polar_data_color = d3.scale.category10();
function generate_polar_data() {
    random_polar_data.length = 0;
    for (var i = 0; i < 10; i++) {
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
var pie_chart_layer;
var pie_chart = new c3.Polar({
    anchor: '#pie_example_chart',
    width: 300,
    height: 300,
    data: random_polar_data,
    // Create a single **pie chart** layer
    layers: [
        pie_chart_layer = new c3.Polar.Layer.Pie({
            // A key is necessary for pie charts
            key: function (d) { return d.id; },
            value: function (d) { return d.value; },
            sort: false,
            // Set an `inner_radius` to create a "donut chart"
            // These could also be callbacks
            inner_radius: 0.2,
            outer_radius: 0.8,
            pad: 0.01,
            // Style the pie chart arc segments
            arc_options: {
                // Tooltip with just the value, and color based on the data
                title: function (d) { return d.value; },
                styles: {
                    'fill': function (d) { return d.color; },
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
                title: function (d) { return "Other"; },
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
var polar_segment_chart = new c3.Polar({
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
        new c3.Polar.Layer.Arc({
            key: function (d) { return d.id; },
            value: function (d) { return d.value; },
            // Arc segments layers can define the radius and angle extents of the segment region.
            inner_radius: function (d) { return d.radius; },
            outer_radius: function (d) { return d.radius + d.height; },
            start_angle: function (d) { return d.id; },
            end_angle: function (d) { return d.id + (d.value / 5); },
            // Style and animate the arc segments
            arc_options: {
                title: function (d) { return d.value; },
                styles: {
                    'fill': function (d) { return d.color; },
                },
                animate: true,
                duration: 4000,
            },
        }),
    ],
}).render();
// ## Create a Half-moon Pie Chart
var half_moon_chart = new c3.Polar({
    anchor: '#half_moon_example_chart',
    width: 600,
    height: 600,
    data: random_polar_data,
    // Setup the angular range from -π/2 to π/2 to create a "half moon" effect.
    angular_range: [-Math.PI / 2, Math.PI / 2],
    zoomable: true,
    layers: [
        new c3.Polar.Layer.Pie({
            key: function (d) { return d.id; },
            value: function (d) { return d.value; },
            sort: false,
            // Create a half-ring with these radius
            inner_radius: 0.6,
            outer_radius: 0.9,
            pad: 0.015,
            arc_options: {
                // Style the arc segments
                title: function (d) { return d.value; },
                styles: {
                    'fill': function (d) { return d.color; },
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
                title: function (d) { return "Other"; },
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
        new c3.Polar.Layer.Pie({
            key: function (d) { return d; },
            value: function (d) { return d; },
            inner_radius: 0.55,
            outer_radius: 0.5,
            pad: 0.015,
            data: [3, 2, 1],
            // Style the segments to be red, green, and blue respectively.
            arc_options: {
                title: "Example extra data layer",
                styles: {
                    'fill': function (d, i) { return ['red', 'green', 'blue'][i]; },
                },
            },
        }),
        // Create a third layer of **radial** line vectors.
        new c3.Polar.Layer.Radial({
            value: function (d) { return d; },
            // Use a global array for the data so it can be shared with the legend
            data: radial_line_values,
            // Allow the lines to be **draggable**
            draggable: true,
            // Draw one vector with an infinite length and the other with the full radius of 1
            outer_radius: function (d, i) { return i ? 1 : Infinity; },
            // Style one line in red and the other in green.
            line_options: {
                styles: {
                    'stroke': function (d, i) { return ['red', 'green'][i]; },
                    'stroke-dasharray': '10,5',
                    'stroke-width': 3,
                },
            },
            handlers: {
                // When the lines are dragged, update the original data array and sync with the
                // legend by redrawing it.
                drag: function (value, d, i) {
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
var radial_line_values_legend = new c3.Legend({
    anchor: '#line_values_legend',
    data: radial_line_values,
    // Display the value as a truncated integer percentage 
    item_options: {
        text: function (d) { return ((d * 100) | 0) + '%'; },
    },
    // Use a matching colored swatch for the legend bullets
    bullet_options: {
        html: '',
        styles: {
            'background': function (d, i) { return ['red', 'green'][i]; },
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
$('#sync_generate_button').on('click', function () {
    generate_polar_data();
    pie_chart.redraw();
    half_moon_chart.redraw();
    polar_segment_chart.redraw();
});
// Enable animations when transitioning datasets
$('#enable_animations').on('change', function () {
    pie_chart.layers[0].arc_options.animate = this.checked;
    half_moon_chart.layers[0].arc_options.animate = this.checked;
    polar_segment_chart.layers[0].arc_options.animate = this.checked;
});
// Enable sorting pie wedges
$('#enable_sorting').on('change', function () {
    pie_chart.layers[0].sort = this.checked;
    pie_chart.redraw();
    half_moon_chart.layers[0].sort = this.checked;
    half_moon_chart.redraw();
});
// Limit the number of elements that will be drawn.
// If there are too many elements, then the ones with the smallest value won't be drawn.
$('#limit_segment_count').on('input', function () {
    pie_chart.layers[0].limit_elements = +$(this).val();
    pie_chart.redraw();
    half_moon_chart.layers[0].limit_elements = +$(this).val();
    half_moon_chart.redraw();
    polar_segment_chart.layers[0].limit_elements = +$(this).val();
    polar_segment_chart.redraw();
});
//# sourceMappingURL=pie_example.js.map