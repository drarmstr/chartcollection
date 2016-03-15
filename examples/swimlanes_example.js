// == C3 Swimlane Timelines ==
// _Demonstrate how to create timelines with swimlanes._
// == Prepare the Segment Data ==
// A function to generate random swimlane data
function generate_segment_data(data) {
    data.length = 0;
    var color_scale = d3.scale.category10();
    var color = color_scale('seed');
    for (var swimlane = 0; swimlane < 4; swimlane++)
        for (var time = Math.random() * 5; time < 100; time += Math.random() * 15) {
            var duration = Math.random() * 15;
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
    c3.array.sort_up(data, function (d) { return d.time; });
}
// == Create the Segment Swimlane Chart ==
// Create a `c3.Plot` chart.
var segment_layer;
var swimlane_timeline = new c3.Plot.Zoomable({
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
        segment_layer = new c3.Plot.Layer.Swimlane.Segment({
            // Accessor functions which describe how to get **x**, **dx** and **y** values from the data elements.
            x: function (d) { return d.time; },
            dx: function (d) { return d.duration; },
            y: function (d) { return d.swimlane; },
            rect_options: {
                // Static styles are more efficiently handled in a CSS file, this is just an example.
                styles: {
                    'fill': function (d) { return d.color; },
                    'stroke': function (d) { return d3.rgb(d.color).darker().toString(); },
                    'stroke-width': 2,
                    'rx': 5,
                    '-webkit-transform': 'scale(1,0.75)',
                    '-webkit-transform-origin': 'center',
                    'shape-rendering': 'geometricPrecision',
                },
            },
            // Create **lables** for each segment
            label_options: {
                text: function (d) { return Math.round(d.duration); },
                styles: {
                    'font-weight': 'bold',
                    'text-shadow': function (d) { return '1px 1px 1px ' + d3.rgb(d.color).brighter().toString(); },
                },
            },
            // An HTML tooltip
            hover: function (d) { return d ? Math.round(d.duration) : null; },
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
// == Create the Sampled Swimlane Charts ==
// Create a `c3.Plot` chart.
var sampled_svg_timeline = new c3.Plot.Zoomable({
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
        new c3.Plot.Layer.Swimlane.Sampled.SVG({
            // Accessor functions which describe how to get **x**, **dx** and **y** values from the data elements.
            x: function (d) { return d.time; },
            dx: function (d) { return d.duration; },
            y: function (d) { return d.swimlane; },
            line_options: {
                title: function (d) { return Math.round(d.duration); },
                styles: {
                    'stroke': function (d) { return d.color; },
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
var sampled_canvas_timeline = new c3.Plot.Zoomable({
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
        new c3.Plot.Layer.Swimlane.Sampled.Canvas({
            // Accessor functions which describe how to get **x**, **dx** and **y** values from the data elements.
            x: function (d) { return d.time; },
            dx: function (d) { return d.duration; },
            y: function (d) { return d.swimlane; },
            safe: false,
            line_options: {
                styles: {
                    'stroke': function (d) { return d.color; },
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
            hover: function (d) { return d ? Math.round(d.duration) : null; },
        }),
    ],
});
// == Render the Charts ==
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
$('#sync_generate_button').on('click', function () {
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
    }
    else {
        $('#limit_segment_count').prop('disabled', true);
        segment_layer.limit_elements = null;
    }
    swimlane_timeline.redraw();
});
// Adjust the number of elements to limit as the slider is changed
$('#limit_segment_count').on('input', function () {
    segment_layer.limit_elements = +$(this).val();
    swimlane_timeline.redraw();
});
// The `input` event not supported in IE
$('#limit_segment_count').on('change', function () {
    segment_layer.limit_elements = +$(this).val();
    swimlane_timeline.redraw();
});
// Resize the chart to fit the window
window.onresize = function () {
    swimlane_timeline.resize();
    sampled_svg_timeline.resize();
    sampled_canvas_timeline.resize();
};
//# sourceMappingURL=swimlanes_example.js.map