// # C3 Plot Regions
// _Demonstrate moveable regions in a Plot_
// ## Chart Plot Legend
// Create a chart with various layers for demonstration purposes.
// We will then link a `plot_legend` to this chart.
// Notice how the `name` properties of each layer and stack is used in the legend.
var region_layer;
var plot = new c3.Plot({
    anchor: document.querySelector('#region_example'),
    anchor_styles: { 'display': 'inline-block', 'margin-left': '10%' },
    height: 300,
    width: '80%',
    // This chart will treat the value of data elements as the Y value and the
    // index of the element as the X value.
    h: d3.scale.linear().domain([0, 100]),
    v: d3.scale.linear().domain([0, 1]),
    // Add a horizontal axis with grid lines.
    axes: [
        new c3.Axis.X({
            grid: true
        }),
    ],
    layers: [
        new c3.Plot.Layer.Line({
            data: (function () {
                var data = [];
                for (var i = 0; i < 100; i++) {
                    data.push(Math.random());
                }
                return data;
            })(),
            x: function (d, i) { return i; },
            y: function (d) { return d; },
            path_options: { styles: { stroke: 'darkblue' } }
        }),
        new c3.Plot.Layer.Region({
            data: [
                { x: 20, x2: 30, color: 'red' },
                { x: 65, x2: 85, color: 'green' },
            ],
            x: function (d) { return d.x; },
            x2: function (d) { return d.x2; },
            draggable: true,
            rect_options: {
                styles: {
                    fill: function (d) { return d.color; },
                    opacity: 0.5
                }
            },
            handlers: {
                dragend: function (v, d) { d.x = v.x; d.x2 = v.x2; }
            }
        }),
        new c3.Plot.Layer.Region({
            data: [
                { x: 45, x2: 55, y: .4, y2: .6, color: 'blue' },
            ],
            x: function (d) { return d.x; },
            x2: function (d) { return d.x2; },
            y: function (d) { return d.y; },
            y2: function (d) { return d.y2; },
            draggable: true,
            rect_options: {
                styles: {
                    fill: function (d) { return d.color; },
                    opacity: 0.5
                }
            },
            handlers: {
                dragend: function (v, d) { d.x = v.x; d.x2 = v.x2; d.y = v.y; d.y2 = v.y2; }
            }
        }),
    ]
}).render();
// Resize the chart to fit the window
window.onresize = function () { plot.resize(); };
// ## Forms to modify legend options
// // Invert the layers in the legend
// $('#invert_layers').on('change', function () {
//     (<c3.Legend.PlotLegend>plot_legend).invert_layers = this.checked;
//     plot_legend.redraw();
// });
