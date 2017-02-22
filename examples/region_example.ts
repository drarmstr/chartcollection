// # C3 Plot Regions
// _Demonstrate moveable regions in a Plot_


// ## Chart Plot Legend

// Create a chart with various layers for demonstration purposes.
// We will then link a `plot_legend` to this chart.
// Notice how the `name` properties of each layer and stack is used in the legend.
var region_layer: c3.Plot.Layer.Region<number>;
var plot = new c3.Plot({
    anchor: <HTMLElement>document.querySelector('#region_example'),
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
            grid: true,
        }),
    ],

    layers: [
        // Add a silly line layer for the background
        new c3.Plot.Layer.Line<number>({
            data: (() => {
                const data = [];
                for (let i = 0; i < 100; i++) {
                    data.push(Math.random());
                }
                return data;
            })(),
            x: (d, i) => i,
            y: (d) => d,
            path_options: { styles: { stroke: 'darkblue' } },
        }),

        // Add a **Region** layer with vertical regions.
        // Vertical regions don't define `y` or `y2`.
        // These regions are draggable and resizable.
        new c3.Plot.Layer.Region<{x:number, x2: number, color: string}>({
            data: [
                { x: 20, x2: 30, color: 'red' },
                { x: 65, x2: 85, color: 'green' },
            ],
            x: (d) => d.x,
            x2: (d) => d.x2,

            draggable: true,
            resizeable: true,

            rect_options: {
                styles: {
                    fill: (d) => d.color,
                    opacity: 0.5,
                },
            },

            // It is important to update the original data element based on the
            // new location/size.  This must be done manually as there is no
            // automatic inverse of the user-provided accessors for setting the
            // opaque data type.
            handlers: {
                dragend: (v, d) => { d.x = v.x; d.x2 = v.x2; },
            }
        }),

        // Add a **Region** layer with a rectangular region.
        new c3.Plot.Layer.Region<{x:number, x2: number, y: number, y2: number, color: string}>({
            data: [
                { x: 45, x2: 55, y: .4, y2: .6, color: 'blue' },
            ],
            x: (d) => d.x,
            x2: (d) => d.x2,
            y: (d) => d.y,
            y2: (d) => d.y2,

            draggable: true,
            resizeable: true,

            rect_options: {
                styles: {
                    fill: (d) => d.color,
                    opacity: 0.5,
                },
            },

            // It is important to update the original data element based on the
            // new location/size.  This must be done manually as there is no
            // automatic inverse of the user-provided accessors for setting the
            // opaque data type.
            handlers: {
                dragend: (v, d) => { d.x=v.x; d.x2=v.x2; d.y=v.y; d.y2=v.y2; },
            }
        }),

    ],
}).render();

// Resize the chart to fit the window
window.onresize = function () { plot.resize(); }

// ## Forms to modify legend options

// // Invert the layers in the legend
// $('#invert_layers').on('change', function () {
//     (<c3.Legend.PlotLegend>plot_legend).invert_layers = this.checked;
//     plot_legend.redraw();
// });
