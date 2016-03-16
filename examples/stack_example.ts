// # C3 Stacked Bar Chart
// _This example explores a few different types of **stacked** charts._
// _It shows the flexibility in how the data may be organized for stacked visualzations._

// Instead of attaching charts to existing div anchors in the html, this example
// dynamically creates and attached them to the DOM.
var div_selection = d3.select('#stack_example_plots');

// Create **ordinal** scales to manage the _age group_ and _race_ 
// categories provided by the CDC.
var five_year_age_group_scale = d3.scale.ordinal().domain([
    '1', '1-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39',
    '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74', '75-79',
    '80-84', '85-89', '90-94', '95-99', '100+', 'NS'
]);
var ten_year_age_group_scale = d3.scale.ordinal().domain([
    '1', '1-4', '5-14', '15-24', '25-34', '35-44',
    '45-54', '55-64', '65-74', '75-84', '85+'
]);
var race_scale = d3.scale.ordinal().domain(['native', 'asian', 'black', 'white']);

// Create scales to select colors for the various causes of death and regions.
var cause_color = d3.scale.category20();
var region_color = d3.scale.category10();

// The **data** for the cause of death data we load from the CDC below.
// It's an array of records where each record has the following fields:
// * `age_group` - A string with the age group, see above.
// * `cause` - String for the cause of death.
// * `deaths` - Number of deaths.
interface CDCDeathData {
    age_group: string
    cause: string
    deaths: number
}

div_selection.append('p').text("\
    These stacked area charts use a single normalized data array.\
    Each element in the array is a data point for a particular age and stack.\
    There is a key function to determine which stack each data item belongs to.");
div_selection.append('p').text("\
    These examples also demonstrate loading chart data dynamically via AJAX.");


// ## Stacked Area Chart

// The first example is a stacked area graph.
// Create a `c3.Plot` and assign it to a newly attached div node.
var stacked_area_chart = new c3.Plot<CDCDeathData>({
    anchor: <HTMLElement>div_selection.append('div').node(),
    height: 300,

    // The **vertical scale** is a normal linear scale for the number of deaths.
    // Note that for the **horizontal scale** we are using an **ordinal ** scale!
    h: five_year_age_group_scale,
    v: d3.scale.linear().domain([0, 4500000]),

    // Accessors describing how to get the **x** and **y** values from the data.
    x: (d) => d.age_group,
    y: (d) => d.deaths,

    // Create an **area** layer for the plot.
    // Setting `stack_options` will enable the **stacking** functionality.
    // For normalized data use `stack_options.key` to define an accessor which provides
    // a key that uniquely describes the stack that each data element should belong to.
    // Here we stack the data based on cause of death.
    layers: [
        new c3.Plot.Layer.Area<CDCDeathData>({
            interpolate: 'cardinal',
            stack_options: {
                key: (d) => <any>d.cause,
                styles: { 'fill': (stack) => cause_color(stack.key) },
                title: (stack) => stack.key,  // Setup tooltips
            },
        }),
    ],

    // Setup **margins** and **axes** to polish up the example.
    // Notice how _grid lines_, scale _tick marks_, and _labels_ can be enabled/disabled
    // and custom `tick_label` formatters setup.
    margins: { right: 20 },
    axes: [
        new c3.Axis.X({
            label: "Causes of Death",
            orient: 'top',
            scale: false,
        }),
        new c3.Axis.X({
            label: "Age",
            scale: d3.scale.linear().domain([0, 100]),
            tick_size: 0,
        }),
        new c3.Axis.Y({
            label: "Deaths",
            tick_label: (d) => (d/1000000)+"m",
            grid: true,
        }),
    ],
});


// ## Expanded Area Chart
div_selection.append('hr')

// The second example is the same as the first except it **expands** the stacked data
// to represent a breakdown of percentages of deaths instead of an absolute count of deaths.
var expand_area_chart = new c3.Plot<CDCDeathData>({
    anchor: <HTMLElement>div_selection.append('div').node(),
    height: 300,

    // Note that since we are using percentages, the default vertical scale of 0-1 works fine.
    h: five_year_age_group_scale,
    x: (d) => d.age_group,
    y: (d) => d.deaths,

    // Specify `offset: 'expand'` here to **stack** the data normalized from 0-1 instead of by
    // absolute values.  This effectively provides a breakdown of the relative contribution
    // from each stack.
    layers: [
        new c3.Plot.Layer.Area<CDCDeathData>({
            interpolate: 'cardinal',
            stack_options: {
                key: (d) => <any>d.cause,
                offset: 'expand',
                styles: { 'fill': (stack) => cause_color(stack.key) },
                title: (stack) => stack.key,  // Setup tooltips
            },
        }),
    ],

    margins: { right: 20 },
    axes: [
        new c3.Axis.X({
            label: "Causes of Death",
            orient: 'top',
            scale: false,
        }),
        new c3.Axis.X({
            label: "Age",
            scale: d3.scale.linear().domain([0, 100]),
            tick_size: 0,
        }),
        new c3.Axis.Y({
            label: "Percentage of Deaths",
            // Convert the factor to a percentage when displaying.
            tick_label: (d) => (d * 100) + '%',
            grid: true,
        }),
    ],
});


// ## Expanded Bar Chart
div_selection.append('hr')
div_selection.append('p').text("\
    This stacked bar chart has a single data array where each data item contains data for all stacks.\
    Each stack is defined with a custom accessor to obtain its value from the data array.");

// Create the `c3.Plot`.
var expanded_bar_chart = new c3.Plot({
    anchor: <HTMLElement>div_selection.append('div').style('display', 'inline-block').node(),
    height: 300,
    width: 400,

    // Sometimes we _don't_ have fully **normalized data**.  Here we have a dataset with one
    // entry per x value (race), and each object contains the values for all of the stacks.
    data: [
        { race: 'native', northeast: 6111, midwest: 29616, south: 43688, west: 81546 },
        { race: 'asian', northeast: 71853, midwest: 37443, south: 68215, west: 328879 },
        { race: 'black', northeast: 569686, midwest: 662679, south: 1940938, west: 288980 },
        { race: 'white', northeast: 5041763, midwest: 6159459, south: 8954636, west: 4890548 },
    ],

    // Setup **scales** and **x** accessor.
    // Note we are using an _ordinal_ horizontal scale and the default vertical scale.
    h: race_scale,
    x: (d) => d.race,

    // Create the **stacked bar** layer.
    // Here we manually specify the set of stacks that are present.
    // Because we don't have a `stack_options.key` defined, each layer will get its own copy
    // of the data.However, each stack can have its own **y ** accessor to get its
    // particular value for that stack with the datum.
    layers: [
        new c3.Plot.Layer.Bar({
            name: "Region",
            bar_width: '75%',
            stack_options: {
                offset: 'expand',
                styles: { 'fill': (stack) => region_color(stack.key) },
                title: (stack) => stack.key,  // Setup tooltips
                name: (key) => key,
            },
            stacks: [
                new c3.Plot.Layer.Stackable.Stack<any>({
                    key: <any>'northeast',
                    y: (d) => d.northeast
                }),
                new c3.Plot.Layer.Stackable.Stack<any>({
                    key: <any>'midwest',
                    y: (d) => d.midwest,
                }),
                new c3.Plot.Layer.Stackable.Stack<any>({
                    key: <any>'south',
                    y: (d) => d.south,
                }),
                new c3.Plot.Layer.Stackable.Stack<any>({
                    key: <any>'west',
                    y: (d) => d.west,
                }),
            ],
        }),
    ],
    // _Alternatively_, instead of specifying a y accessor for each stack above,
    // we could have just used this single **y accessor** for the layer:
        
    //        y: (d, i, stack) -> d[stack.key]

    // Add **margins ** and **axes ** to polish the example
    margins: { top: 10, right: 20 },
    axes: [
        new c3.Axis.X({
            label: "Where People Die",
            orient: 'top',
            scale: false,
        }),
        new c3.Axis.Y({
            label: "Percentage of Deaths",
            tick_label: (d) => (d * 100) + '%',
        }),
        new c3.Axis.X({
            label: "Race",
        }),
    ],
}).render();

// Create an associated **legend** for this chart
new c3.Legend.PlotLegend({
    anchor: <HTMLElement>div_selection.append('div').node(),
    anchor_styles: {
        'display': 'inline-block',
        'vertical-align': '5em',
    },
    plot: expanded_bar_chart,
}).render();


// ## Stacked Bar Chart
div_selection.append('hr')
div_selection.append('p').text("\
    This stacked bar chart contains seperate data arrays for each stack.");

// Format for death by age data
interface DeathByAgeData {
    age_group: string
    deaths: number
}

// Create the `c3.Plot`.
// Just for kicks this time we don't attach it to an anchor at all.  In this case
// C3 will create a div when we render which we will attach to the DOM later.
var stacked_bar_chart = new c3.Plot<DeathByAgeData>({
    height: 300,

    // Setup **scales ** and **x ** and **y ** accessors.
    // Note we are using an _ordinal_ horizontal scale.
    v: d3.scale.linear().domain([0, 10000000]),
    h: ten_year_age_group_scale,
    x: (d) => d.age_group,
    y: (d) => d.deaths,

    // Add the **stacked bar** layer
    layers: [
        new c3.Plot.Layer.Bar({
            // This represents an _alternative_ way to specify how to **stack** the data.
            // Instead of providing layer `data` you can manually specify which `stacks`
            // should be present and a `data` array for each stack.
            stacks: [
                new c3.Plot.Layer.Stackable.Stack({
                    key: 'Male',
                    options: {
                        title: 'Male',
                        styles: { 'fill': 'blue' },
                    },
                    data: [
                        { age_group: '1', deaths: 146034 },
                        { age_group: '1-4', deaths: 24962 },
                        { age_group: '5-14', deaths: 32467 },
                        { age_group: '15-24', deaths: 101373 },
                        { age_group: '25-34', deaths: 153299 },
                        { age_group: '35-44', deaths: 371670 },
                        { age_group: '45-54', deaths: 802359 },
                        { age_group: '55-64', deaths: 1300745 },
                        { age_group: '65-74', deaths: 2172914 },
                        { age_group: '75-84', deaths: 4139948 },
                        { age_group: '85+', deaths: 5520554 },
                    ],
                }),

                // I am manually entering the data here just as another perspective.
                // `data` arrays can always be defined inline, passed as a variable,
                // and even dynamically updated followed with a call to `redraw()`.
                new c3.Plot.Layer.Stackable.Stack({
                    key: 'Female',
                    options: {
                        title: 'Female',
                        styles: { 'fill': 'pink' },
                    },
                    data: [
                        { age_group: '1', deaths: 186663 },
                        { age_group: '1-4', deaths: 32567 },
                        { age_group: '5-14', deaths: 46053 },
                        { age_group: '15-24', deaths: 288145 },
                        { age_group: '25-34', deaths: 347909 },
                        { age_group: '35-44', deaths: 633523 },
                        { age_group: '45-54', deaths: 1316448 },
                        { age_group: '55-64', deaths: 1957880 },
                        { age_group: '65-74', deaths: 2775456 },
                        { age_group: '75-84', deaths: 3969547 },
                        { age_group: '85+', deaths: 2852141 },
                    ],
                }),
            ],
        }),
    ],
        
    // Setup **margins ** and **axes ** to polish up the example.
    margins: { right: 20 },
    axes: [
        new c3.Axis.X({
            label: "Deaths by Gender",
            orient: 'top',
            scale: false,
        }),
        new c3.Axis.Y({
            label: "Deaths",
            grid: true,
            tick_label: (d) => (d/1000000) + "m",
        }),
        new c3.Axis.X({
            label: "Age Group",
        }),
    ],
}).render();

// Attach chart to the DOM
document.querySelector('#stack_example_plots').appendChild(<HTMLElement>stacked_bar_chart.anchor);
(<HTMLElement>stacked_bar_chart.anchor).style.width = '100%';
stacked_bar_chart.resize();


// ## Resize Charts

// Resize the charts if the window resizes
window.onresize = function () {
    stacked_area_chart.resize();
    expand_area_chart.resize();
    stacked_bar_chart.resize();
};

// ## Load the TSV data

// Use D3 to load the **tsv** data for the students using an AJAX request.
// The `row` callback is used to determine how to parse the rows based on the TSV data;
// notie how the numerical values use a `+` to parse the string into a number.
//
// When the data is loaded the `get` callback is called which we use to call the
// rendering function with the loaded data.
d3.tsv("data/injury_cause.tsv")
    .row((row) => ({
        age_group: row["Five-Year Age Groups Code"],
        cause: row["Injury Mechanism & All Other Leading Causes"],
        deaths: +row["Deaths"],
    }))
    .get((error, data) => {
        if (error) alert("AJAX error downloading CDC data: "+error.statusText);

        // Filter invalid rows from the CDC's tsv file.
        data = data.filter((row) => !!row.cause);

        // Bind **data** to the charts and render them.
        stacked_area_chart.data = data;
        stacked_area_chart.render();
        expand_area_chart.data = data;
        expand_area_chart.render();
    });
