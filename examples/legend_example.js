// # C3 Legends
// _Demonstrate how to use C3 Legends_
// ## Default Legend
// Create a very simple example legend demonstrating the default accessors.
// This data set is an array of strings which are displayed as legend items.
// Elements which are arrays themselves are treated as nested items.
var legend = new c3.Legend();
legend.render({
    // Dynamically add elements to the DOM
    anchor: $('<div></div>').css('display', 'inline-block').appendTo($('#legend_examples'))[0],
    data: [
        "Apples",
        "Oranges",
        ['foo', 'bar'],
        "Really long item name",
        "Spam"
    ],
    width: 150
});
// ## Legend
// This example legend uses user-defined objects for the data elements and defines
// an `item_options.text` accessor function to describe how to display the items.
// It also defines a custom `nest` callback to describe how to get arrays of nested items.
var legend2 = new c3.Legend({
    anchor: $('<div></div>').css('display', 'inline-block').appendTo($('#legend_examples'))[0],
    width: 150,
    data: [
        {
            name: "Fruit",
            types: ["Apples", "Oranges"]
        }, {
            name: "Minerals",
            types: ["Gold", "Sulfur"]
        },
    ],
    nest: function (d) { return d.types; },
    item_options: { text: function (d) { return d.name; } },
    nested_item_options: { text: function (d) { return d; } },
    bullet_options: false
});
legend2.render();
// ## Chart Plot Legend
// A function to generate random data series for the line graphs that jiggle but stay in bounds.
function generate_random_legend_data() {
    var seed = 5 + Math.random() * 5;
    var data = [];
    for (var i = 0; i < 100; i++) {
        seed += Math.random() - 0.5;
        if (seed < 0)
            seed = Math.random();
        else if (seed > 10)
            seed = 10 - Math.random();
        data.push(seed);
    }
    return data;
}
// Generate random bar chart data
var bar_data = [];
for (var i = 0; i < 100; i += 4)
    bar_data.push([Math.random() * 2, Math.random() * 2, Math.random() * 2]);
// Create a chart with various layers for demonstration purposes.
// We will then link a `plot_legend` to this chart.
// Notice how the `name` properties of each layer and stack is used in the legend.
var plot = new c3.Plot();
var bar_layer;
plot.render({
    anchor: $('<div></div>').appendTo($('#plot_legend_example'))[0],
    anchor_styles: { 'display': 'inline-block' },
    height: 300,
    width: '80%',
    // This chart will treat the value of data elements as the Y value and the
    // index of the element as the X value.
    h: d3.scale.linear().domain([0, 100]),
    v: d3.scale.linear().domain([0, 10]),
    x: function (d, i) { return i; },
    y: function (d) { return d; },
    // Add a horizontal axis with grid lines.
    axes: [
        new c3.Axis.X({
            grid: true
        }),
    ],
    layers: [
        // Add a stacked bar- chart layer with 3 stacks.  For more explanation on how to use these
        // layer types please see the [stacked charts examples](../#stack_example).
        bar_layer = new c3.Plot.Layer.Bar({
            name: "Stacked Bar Chart",
            data: bar_data,
            x: function (d, i) { return i * 4; },
            y: function (d, i, stack) { return d[bar_layer.stacks.indexOf(stack)]; },
            stacks: [
                { name: "Blue Stack", options: { styles: { 'fill': 'slateblue' } } },
                { name: "Orange Stack", options: { styles: { 'fill': 'goldenrod' } } },
                { name: "Red Stack", options: { styles: { 'fill': 'firebrick' } } },
            ]
        }),
        // Create 3 line layers with random data.
        new c3.Plot.Layer.Line({
            name: "Series 1",
            data: generate_random_legend_data(),
            options: {
                styles: { 'stroke': 'red' }
            }
        }),
        new c3.Plot.Layer.Line({
            name: "Series 2",
            data: generate_random_legend_data(),
            options: {
                styles: { 'stroke': 'blue' }
            }
        }),
        new c3.Plot.Layer.Line({
            name: "Series 3",
            data: generate_random_legend_data(),
            options: {
                styles: { 'stroke': 'green' }
            }
        }),
        // Create a single dotted horizontal line.
        new c3.Plot.Layer.Line.Horizontal({
            name: "Horizontal Line",
            data: [7],
            line_options: {
                styles: {
                    'stroke': 'violet',
                    'stroke-dasharray': '5 3',
                    'opacity': 0.75
                }
            },
            label_options: {
                text: "Horizontal Line"
            },
            grab_line_options: {
                events: {
                    'click': function () { alert("Click on Horizontal Line"); }
                }
            }
        }),
        // Create a layer of 3 vertical lines.
        // Note how this layer sets the `name` to false so it is not displayed in the legend.
        new c3.Plot.Layer.Line.Vertical({
            name: false,
            data: [Math.random() * 100, Math.random() * 100, Math.random() * 100],
            draggable: true,
            line_options: {
                styles: {
                    'stroke': 'darkorange',
                    'stroke-width': '1px'
                }
            },
            label_options: {
                text: function (d, i) { return "Event " + i; },
                alignment: 'top'
            }
        }),
        new c3.Plot.Layer.Scatter({
            name: "The Sun",
            data: [7],
            x: function () { return 80; },
            r: 10,
            options: {
                styles: { 'fill': 'gold' }
            },
            label_options: {
                text: "sun",
                styles: {
                    'fill': 'black',
                    'font-size': 'xx-small'
                }
            }
        }),
    ]
});
// Now actually create the `plot_legend` and link it with the chart we just created.
// Everything else is automatic, though we could override or extend the behaviour if we wanted to.
var plot_legend = new c3.Legend.PlotLegend({
    anchor: $('<div></div>').appendTo($('#plot_legend_example'))[0],
    anchor_styles: {
        'display': 'inline-block',
        'vertical-align': 'top'
    },
    width: '20%',
    plot: plot
}).render();
// Resize the chart to fit the window
window.onresize = function () { plot.resize(); };
// ## Forms to modify legend options
// Invert the layers in the legend
$('#invert_layers').on('change', function () {
    plot_legend.invert_layers = this.checked;
    plot_legend.redraw();
});
