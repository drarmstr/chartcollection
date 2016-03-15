// C3 Area Plot
// _A simple static area graph._
// Generate the Data
// Generate the data to visualize.  The data to visualize has to be an array.  This example
// demonstrates that it can be an array of anything.  Accessor functions are used to pull out 
// various aspects of the data, such as x and y values.
// This creates an array of objects.  Each element in the array in an
// object with an `x_value` and a `y_value`.  The `x_value`'s go from 0 to 10 and the `y_value`'s 
// are the x value cubed.
var cubed_data = [];
for (var i = 0; i <= 10; i++)
    cubed_data.push({ x_value: i, y_value: i * i * i });
// Create a C3 Plot
// Create a `c3.Plot` chart and attach it to a specific _div_ **anchor ** in the DOM.  Assign it a specific
// height and a relative width and bind it to the generated `cubed_data`.  The height and width are optional
// and could be setup using CSS, JQuery, or any other DOM manipulation instead.
var area_example = new c3.Plot({
    anchor: '#area_example_plot',
    height: 300,
    width: "75%",
    data: cubed_data,
    // Setup the horizontal and vertical **scales ** for the plot.Scales are based on _D3 scales_.
    // When preparing scales for C3 setup the domain based on your user units.  C3 will take 
    // care of the range, which will represent pixels.
    h: d3.scale.linear().domain([0, 10]),
    v: d3.scale.linear().domain([0, 1000]),
    // **Accessor functions** which describe how to get x and y values from the user data.
    x: function (d) { return d.x_value; },
    y: function (d) { return d.y_value; },
    // Reserve **margins ** for the top and right of the plot.This is done to allow the axis labels
    // to fully display.  This is needed because most browsers currently don't support _overflow: visible_
    // for _svg_ elements.
    margins: {
        top: 10,
        right: 20,
    },
    // Setup `c3.Axis` objects.  C3 plots may have up to 4 **axes ** attached for the top, bottom,
    // left, and right of plots.  Axes may also be created independent of plots for layout flexibility
    // which is covered in another example.  These axes also enable grid lines in the plot.  They are 
    // dotted lines because of styles setup in the `examples.less` stylesheet.
    axes: [
        new c3.Axis.X({
            tick_size: 10,
            grid: true,
        }),
        new c3.Axis.Y({
            grid: true,
        }),
    ],
    // Plots do not render any data by themselves.  Instead, they host a set of **layers ** which are
    // superimposed on the plot to visualize the same or different data sets.  There are different 
    // types of layers such as line graphs, scatter plots, swim - lane segments, etc.  This example 
    // just uses a very simple area plot.  The `interpolate: 'basis'` causes the rendered path to use 
    // a smooth curve based on the data points instead of straight linear sections.
    layers: [
        new c3.Plot.Layer.Area({
            interpolate: 'basis',
        }),
    ],
});
// Resize the chart to fit the window
window.onresize = function () {
    area_example.resize();
};
// Render the chart!
area_example.render();
//# sourceMappingURL=plot_area_example.js.map