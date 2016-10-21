// # C3 Zoomable Plot
// _A plot that is zoomable and demonstrates some custom styling._

// Data array of numbers from -10 to 10
var zoom_example_data = []
for (let x = -10; x <= 10; x++) zoom_example_data.push(x);

// ## Create the C3 chart
// Create a `c3.Plot.horiz_zoom` to enable horizontal zooming and attach it to
// the `#zoom_example_plot` DOM element.
var zoom_line_layer: c3.Plot.Layer.Line<number>;
var zoom_example = new c3.Plot.Zoomable<number>({
    anchor: '#zoom_example_plot',
    width: "75%",
    zoomable: 'h',

    // Bind to a **data** array of numbers from -10 to 10.
    data: zoom_example_data,

    // Setup the user **scales** for the plot.  The scale domains represent user units.  This chart
    // will have x values go from -10 to 10 and y values go from -50 to 80.  C3 will take care of the range.
    h: d3.scale.linear().domain([-10, 10]), // horizontal scale
    v: d3.scale.linear().domain([-50, 80]), // vertical scale

    // An **accessor function** to get the x value of the data points based on the data element.
    x: (d) => d,

    // The maximum **zoom factor** that the user is allowed to zoom in.  The user cannot zoom out more
    // than the original defined domain.
    zoom_extent: 16,

    // Define **margins** for the chart to allow extra room for the labels on the edges to fit.
    margins: {
        top: 10,
        right: 20,
    },

    // Setup `c3.Axis` objects.  C3 plots may have up to 4 **axes** attached for the top, bottom,
    // left, and right of plots.  Axes may also be created independent of plots for layout flexibility
    // which is covered in another example.  These axes also enable grid lines in the plot.  They are
    // dotted lines because of styles setup in the `examples.less` stylesheet.
    axes: [
        new c3.Axis.X({
            grid: true,
            tick_size: 10, // Make the X Axis tick marks a little bigger
            path_size: 3, // Make the axis domain line a bit thicker
        }),
        new c3.Axis.Y({
            grid: true, // draw grid lines in addition to the tick marks
            path_size: 3, // Make the axis domain line a bit thicker
        }),
    ],

    // Plots do not render any data by themselves.  Instead, they host a set of **layers** which are
    // superimposed on the plot to visualize the same or different data sets.  There are different
    // types of layers such as line graphs, scatter plots, swim-lane segments, etc.
    layers: [
        // This first layer is used to draw a horizontal line at y=0.  It does not use the default
        // data and instead uses a single value of 0 for the line.
        new c3.Plot.Layer.Line.Horizontal({
            data: [0],
            options: {
                styles: {
                    'stroke': 'black',
                    'stroke-width': '3px',
                },
            },
        }),

        // Draw a vertical line at x=0.
        new c3.Plot.Layer.Line.Vertical({
            data: [0],
            options: {
                styles: {
                    'stroke': 'black',
                    'stroke-width': '3px',
                },
            },
        }),

        // Add another layer for drawing a **line graph**.  This layer defines its own **y** function
        // to be a _sine wave_ and to use `basis` interpolation to form a smooth curve.
        // This layer also introduces a new way to style the layer in addition to CSS stylesheets.
        // The object passed in to `paths.styles` has a set of key/value pairs.  The keys represent
        // the style names to configure while the values determine how to set those styles.  This
        // example just uses a constant value for the color.  In later examples you'll see how this
        // can also be a function to style based on the data.  Assign this layer to a variable
        // `zoom_line_layer` for later manipulation.
        zoom_line_layer = new c3.Plot.Layer.Line<number>({ // Add a line-graph layer to this plot
            y: (d) => 40 * Math.sin(d),
            interpolate: 'basis',
            options: {
                styles: {
                    'stroke': 'red',
                },
            },
        }),
    ],
});

// ## Render the plot!
// Perform the initial rendering of the chart.
zoom_example.render();

// ## Setup interactive behaviour
// Use JQuery to assign handlers to buttons in the example html that will modify the chart
// rendering or styles.

// When the function selection buttons are clicked, change the function used to determine the
// **y value** or line interpolation for the `zoom_line_layer`.  After the change is made
// `redraw()` needs to be called to update the chart based on the new data or accessor function.
$('#zoom_sin_button').click(function () {
    zoom_line_layer.y = (d) => 40 * Math.sin(d);
    zoom_line_layer.interpolate = 'basis';
    zoom_example.redraw();
});
$('#zoom_square_button').click(function () {
    zoom_line_layer.y = (d) => 40 * Math.sin(d);
    zoom_line_layer.interpolate = 'step-before';
    zoom_example.redraw();
});
$('#zoom_parabolic_button').click(function () {
    zoom_line_layer.y = (d) => d * d;
    zoom_line_layer.interpolate = 'basis';
    zoom_example.redraw();
});

// When the color selection buttons are clicked change the path style.  The `restyle()` API
// should be used here to update the styles used in the chart.  This will avoid the cost of
// updating all of the data and rendering and only update classes and styles.
$('#zoom_red_button').click(function () {
    zoom_line_layer.options.styles = { stroke: 'red' };
    zoom_example.restyle();
});
$('#zoom_green_button').click(function () {
    zoom_line_layer.options.styles = { stroke: 'green' };
    zoom_example.restyle();
});

// Just for fun, if the `#zoom_bell_button` is clicked then add a new layer with a bell curve.
var variance = 10;
$('#zoom_bell_button').click(function () {
    zoom_example.layers.unshift(new c3.Plot.Layer.Area<number>({
        y: (d) => 500 / (Math.sqrt(variance) * Math.sqrt(2 * Math.PI)) *
            Math.pow(Math.E, -((d * d) / (2 * variance))),
        interpolate: 'basis',
        baseline: 0,
        options: {
            styles: {
                'fill': 'darkslategray',
                'opacity': 0.5,
            },
        },
    }));
    zoom_example.render();
});

// Allow the user to change the _variance_ used to compute the function.
$('#zoom_bell_variance_select').on('change', function () {
    variance = $(this).val();
    zoom_example.redraw();
});

// Resize the chart to fit the window
window.onresize = function() { zoom_example.resize(); }
