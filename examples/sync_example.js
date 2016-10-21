// # C3 Synchronized Plots
// _Demonstration how to link together two plots for one to zoom based on the selection in
// the other and vice versa._
var random_sync_data = [];
function generate_sync_data() {
    random_sync_data.length = 0;
    for (var x = 0; x < 100; x += 5 * Math.random()) {
        random_sync_data.push({
            x_value: x,
            y_value: 10 * Math.random()
        });
    }
}
// Generate initial dataset.
generate_sync_data();
// Allow the user generate new data by clicking on a button.  We need to `redraw()` the charts
// to reflect the updated data.  _Note_: if we had cleared random_data via: `random_data = []`
// in the `generate_data()` function, then this wouldn't work.  It would just have updated the
// variable and not the array that the charts are working with.  That's why `random_data.length=0` is used.
$('#sync_generate_button').on('click', function () {
    generate_sync_data();
    select_chart.redraw();
    zoom_chart.redraw();
});
// ## Create the Selection Chart
// Create a `c3.Plot.Selectable` chart.  The _Selectable_ type of plot will enable
// the user to make **selections**.  Attach it to the `#sync_select_example_plot` 
// node, set the width and height, and bind it to the `random_data` we generated.
// `drag_selections` determines if you can drag existing selections or if a new one is made.
var select_chart = new c3.Plot.Selectable({
    anchor: '#sync_select_example_plot',
    width: '90%',
    height: 100,
    selectable: 'h',
    drag_selections: true,
    data: random_sync_data,
    // Setup the **scales** to go from 0-100 horizontally and 0-10 vertically.
    h: d3.scale.linear().domain([0, 100]),
    v: d3.scale.linear().domain([0, 10]),
    // Accessor functions which describe how to get **x** and **y** values from the data elements.
    x: function (d) { return d.x_value; },
    y: function (d) { return d.y_value; },
    // Add an **x axis** with grid lines to the _top_ of the chart.
    axes: [
        new c3.Axis.X({
            grid: true,
            orient: 'top'
        }),
    ],
    // Add a _dark green_ **area layer** to draw the data
    layers: [
        new c3.Plot.Layer.Area({
            interpolate: 'step-before',
            options: {
                styles: {
                    'fill': 'darkgreen'
                }
            }
        }),
        // Add this layer just for fun.
        new c3.Plot.Layer.Line({
            y: function (d) { return 10 - d.y_value; },
            interpolate: 'basis',
            options: {
                styles: {
                    'stroke': 'orange'
                }
            }
        }),
    ]
});
// ## Create the Zoom Chart
// Create a `c3.Plot.Zoomable` chart mostly like the selection chart.
var zoom_chart = new c3.Plot.Zoomable({
    anchor: '#sync_zoom_example_plot',
    width: '90%',
    height: 250,
    data: random_sync_data,
    zoomable: 'h',
    zoom_extent: 16,
    h: d3.scale.linear().domain([0, 100]),
    v: d3.scale.linear().domain([0, 10]),
    x: function (d) { return d.x_value; },
    y: function (d) { return d.y_value; },
    axes: [
        new c3.Axis.X({
            grid: true
        }),
    ],
    // Use _dark blue_ for this layer instead.
    layers: [
        new c3.Plot.Layer.Area({
            interpolate: 'step-before',
            options: {
                styles: {
                    'fill': 'darkblue'
                }
            }
        }),
        // This layer is silly.
        new c3.Plot.Layer.Line({
            y: function (d) { return 10 - d.y_value; },
            interpolate: 'basis',
            options: {
                styles: {
                    'stroke': 'orange'
                }
            }
        }),
    ]
});
// ## Render the Charts
// Call `render()` on the charts to initially render them.
select_chart.render();
zoom_chart.render();
// Resize the chart to fit the window
window.onresize = function () {
    select_chart.resize();
    zoom_chart.resize();
};
// Allow user to change if existing selections can be adjusted
$('#move_selection').on('change', function (e) {
    select_chart.drag_selections = this.checked;
    select_chart.resize();
});
// If the `selectend` and `zoomend` events were captured instead, then the other
// chart would update only when the selection was finished or the zoom action was finished.
// This can be beneficial when it is expensive to update everything.
$('#sync_end_select').on('change', function () {
    var postfix = $(this).val(); // This is either "end" or ""
    select_chart.on('select', null);
    select_chart.on('selectend', null);
    zoom_chart.on('zoom', null);
    zoom_chart.on('zoomend', null);
    select_chart.on('select' + postfix, function (extent) { zoom_chart.focus(extent); });
    zoom_chart.on('zoom' + postfix, function (extent) { select_chart.select(extent); });
});
// ## Link Their Selection and Zooming
// These two lines are all it takes to **link** the two charts together.
// By setting up event handlers on the `select` and `zoom` events a controller can 
// cause the other chart to `select()` or `focus()`.
select_chart.on('select', function (extent) { zoom_chart.focus(extent); });
zoom_chart.on('zoom', function (extent) { select_chart.select(extent); });
