// # C3 Crossfilter Dataset
// _An example the includes many plots and tables synchronized with a common dataset using [**Crossfilter **][Crossfilter]._
// _This example also includes more demonstration on how to style and extend custom charts._
// [Crossfilter]: http://square.github.io/crossfilter/ "Crossfilter Library"
//
// Crossfilter is a great library for managing large multivariate datasets and filtering on multiple dimensions.

// ###########################################################################
// ## Load the Data

// Three data models for this example to visualize.
// * **gdp_data** - array of objects with `country_name`, `country_code`, `year`,
// and other properties from World Bank indicators based on the `indicator_mapping`.
interface GDPData {
    country_name: string;
    country_code: string;
    year: number;
    population: number;
    urban_population: number;
    gdp: number;
    gdp_per_capita: number;
    land_area: number;
    agriculture: number;
    manufacturing: number;
    services: number;
}
// * **counties** - map of country codes to objects with `name`, `code`, and `region_id`.
interface Country {
    name: string;
    code: string;
    region_id: number;
}
// * **regions** - map of region ids to objects with `name`, `id`, and `parent_id`.
interface Region {
    name: string;
    id: number;
    parent_id: number;
}
// To keep things simple this example doesn't use
// a proper _MVC_ architecture, so we'll just use some simple global objects:
var gdp_data: GDPData[] = [];
var countries: { [code: string]: Country } = {};
var regions: { [id: number]: Region } = {};

// The following function will download the sample datasets about countries, GDP metrics, etc from **CSV files**.
// For purposes of understanding the C3 visualization you can skip this section.  Most of it is about
// transforming the data from the format that the **World Bank** provides to a format best suited to 
// working with the **Crossfilter** library.  We could have done this transformation ahead of time and 
// just used that modified CSV, but I wanted to work with the CSV in the original format to be able to
// update the data or get new metrics from the World Bank.
function download_data() {
    var indicator_mapping = {
        'SP.POP.TOTL': 'population',
        'EN.URB.MCTY.TL.ZS': 'urban_population',
        'NY.GDP.MKTP.CD': 'gdp',
        'NY.GDP.PCAP.CD': 'gdp_per_capita',
        'AG.LND.TOTL.K2': 'land_area',
        'NV.AGR.TOTL.CD': 'agriculture',
        'NV.IND.MANF.CD': 'manufacturing',
        'NV.SRV.TETC.CD': 'services',
    };

    // This function returns a [_promise_](http://promises-aplus.github.io/promises-spec/)
    // to easily manage multiple CSV dependencies asynchronously.
    // The user provides a callback to the promise that will exectute when the promise is _resolved_.
    // `Promise.all()` will create a promise with multiple dependencies, one for each of the three CSV files to download and process.
    return Promise.all([
        new Promise((resolve) => {
            // ### Load World Bank Data **CSV**

            // Use _D3_ to download the GDP and other metrics from the **World Bank CSV** file.
            d3.csv('data/gdp.csv')
                // The `row` callback is used to structure what the rows look like based on the CSV data.
                // Notice that the numerical values use a `+` to parse the string to a numerical value.
                .row((row) => ({
                    country_name: row['Country Name'],
                    country_code: row['Country Code'],
                    indicator: row['Indicator Code'],
                    value: +row['Value'],
                    year: +row['Year'],
                }))
                // The `get` callback is used to process the data once it is loaded.
                // The World Bank provides the data in a format with a single value per row.
                // This code translates that to a format with a row for each country and year combination and
                // a column for each additional metric provided.
                .get((error, rows) => {
                    var tmp_map = {};
                    for (let row of rows) {
                        if (!row.country_code) continue;
                        let data_row;
                        if (!(data_row = tmp_map[row.country_code + row.year]))
                            data_row = tmp_map[row.country_code + row.year] = {
                                country_name: row.country_name,
                                country_code: row.country_code,
                                year: row.year,
                            };
                        data_row[indicator_mapping[row.indicator]] = row.value;
                    }
                    gdp_data = [];
                    for (let k in tmp_map) gdp_data.push(tmp_map[k]);
                    // Convert the GDP metrics to billions of dollars for convenience and ensure
                    // GDP isn't 0 if the data is missing to avoid divide by zero problems.
                    for (let record of gdp_data) {
                        for (let metric of ['gdp', 'agriculture', 'manufacturing', 'services'])
                            record[metric] /= 1000000000;
                        if (!record.gdp) record.gdp = 1;
                    }
                    // Resolve this promise to indicate that this dependency has been met.
                    resolve();
                });
        }),

        // ### Load the country data **CSV**
        new Promise((resolve) => {
            d3.csv('data/countries.csv')
                .row((row) => ({
                    name: row['name'],
                    code: row['world_bank_code'],
                    // Countries include a link to their region.
                    region_id: +row['region-code'],
                }))
                // When the raw CSV has been loaded convert it to an associative map based on country ID.
                // Normally I found it more efficient to manage this data as an array where the index into the array cooresponds to the ID,
                // but just keeping the example simple here.
                .get((error, rows) => {
                    rows.filter((row) => !!row.code).forEach((row) => {
                        countries[row.code] = row;
                    });
                    resolve();
                });
        }),

        // ### Load the region info **CSV**
        // Convert it to an associative object, and resolve its promise when done.
        new Promise((resolve) => {
            d3.csv('data/regions.csv')
                .row((row) => ({
                    name: row['name'],
                    id: +row['id'],
                    parent_id: +row['parent_id'],
                }))
                .get((error, rows) => {
                    for (let row of rows)
                        regions[row.id] = row;
                    resolve();
                });
        }),

    // After all the CSV data has been loaded and processed, remove the wait notification and check
    // the dataset if any countries referenced by the World Bank data are missing from the countries table.
    ]).then(function () {
        d3.selectAll('#waiting').remove();
        d3.selectAll('main').style('display', '');
        for (let record of gdp_data.filter((record) => !countries[record.country_code]))
            throw Error("Missing country: " + record.country_code + " - " + record.country_name);
    });
}

// ###########################################################################
// ## Create and Render the Charts

// This function will create the various charts and tables for this example.
function render() {
    // ### Prepare the data
    // Output the data set to the console if you want to take a look.
    console.log("Data:", gdp_data);
    console.log("Regions:", regions);
    console.log("Countries:", countries);

    // Setup the core metrics dataset with [**Crossfilter**](http://square.github.io/crossfilter/)
    var xf = crossfilter(gdp_data);
    
    // `groupAll()` allows us to get a single value for the entire dataset.
    // In this case we do a reduction based on the total population.
    var total_population = xf.groupAll<number>().reduceSum((d) => d.population);
    var total_gdp = xf.groupAll<number>().reduceSum((d) => d.gdp);

    // Prepare the Crossfilter **dimensions** we can filter the data on.
    // With this we can filter based on country, region, year, urbanization, etc.
    // Notice the _region_ dimension is added even though the dataset doesn't link directly to
    // a region.
    // The _agriculture_, _services_, and _manufacturing_ dimensions are also created based
    // on their percentage of GDP instead of an absolute value.
    var country_dim = xf.dimension((d) => d.country_code);
    var region_dim = xf.dimension((d) => countries[d.country_code].region_id);
    var year_dim = xf.dimension((d) => d.year);
    var urban_dim = xf.dimension((d) => d.urban_population);
    var agriculture_dim = xf.dimension((d) => Math.min(d.agriculture / d.gdp * 100, 100));
    var services_dim = xf.dimension((d) => Math.min(d.services / d.gdp * 100, 100));
    var manufacturing_dim = xf.dimension((d) => Math.min(d.manufacturing / d.gdp * 100, 100));

    // Store an array of all the visualizations in this example.Create `redraw()` and `restyle()`
    // functions to update all of the charts in this example when the dataset is updated via _Crossfilter_.
    // C3 doesn't try to automatically update or resize charts because that can be expensive and so it
    // lets the user indicate when that needs to be done.
    var charts = [];
    function redraw() {
        for (let chart of charts)
            chart.redraw();
    }
    function restyle() {
        for (let chart of charts)
            chart.restyle();
    }

    // These variables will track the country or region the user's mouse is currently hovering over.
    var hover_country;
    var hover_region;


    // ###########################################################################
    // ### GDP Timeline Chart

    // **Crossfiter** dimensions are great for filtering the dataset.  But, we'd also like to visualize
    // the data based on those dimensions.  This first chart will be a timeline, so we'll use the 
    // `year_dim` **dimension**.  The dimension has a function called `group()` which will generate 
    // a **grouping** based on the data. We use `reduceSum()` to **reduce** each entry in the grouping by
    // summing a value specified via a callback.  In this way we can get an arrangement of the data 
    // that is grouped by year, but provides values such as GDP, agriculture GDP, etc.
    // The `all()` method returns us an array of this grouping that is easy to use.  Each entry in
    // the array contains a `key` based on the dimension (the year in this case) and a `value`
    // based on the grouping's reduction.
    var gdp_by_year_data = year_dim.group().reduceSum((d) => d.gdp).all();
    var agriculture_by_year_data = year_dim.group().reduceSum((d) => d.agriculture).all();
    var manufacturing_by_year_data = year_dim.group().reduceSum((d) => d.manufacturing).all();
    var services_by_year_data = year_dim.group().reduceSum((d) => d.services).all();

    // Output the gdp per year data to the console so you can take a look at what it looks like.
    console.log("gdp_by_year_data", gdp_by_year_data);

    // Create a new `c3.Plot` for the timeline.
    var timeline;
    charts.push(timeline = new c3.Plot.Zoomable<CrossFilter.Grouping<number, number>>({
        anchor: '#worldbank_timeline',
        height: 300,

        // Setup the **scales**.  Time will go from the year 1970-2012.  The default chart vertical
        // scale will go from 0-100 for percentages.
        h: d3.scale.linear().domain([1970, 2012]),
        v: d3.scale.linear().domain([0, 100]),

        // The **x** function uses the key directly, which represents the year from the year dimension.
        x: (d) => d.key,
        // The default **y** function generates its value as a percentage of the gdp for that year.
        // There are better ways to do this, but I wanted to demonstrate the flexibility the callbacks
        // provide for visualizing based on the data.
        y: (d) => d.value > 1 ? d.value / gdp_by_year_data[d.key - 1970].value * 100 : 0,

        // Set chart as **zoomable** and limit the maximum amount the user is allowed to zoom in.
        zoomable: 'h',
        zoom_extent: 16,

        // Set margins on all sides of the chart to allow extra room for labels to fit.
        margins: 8,

        // Create **axes** for this plot.
        axes: [
            new c3.Axis.X({
                label: "Year",
                grid: true,
                // Use a D3 formatter here to avoid commas showing up in the year
                tick_label: d3.format('f'),
            }),
            new c3.Axis.Y({
                label: "% of GDP",
                grid: true,
                // Use our own formatter to add a "%" symbol after the number
                tick_label: (n) => n + "%",
            }),
            // Create a third axis for this plot on the right side.This axis will indicate the 
            // scale for the GDP layer which is expressed in dollars instead of percentage.
            // It also shows that we can use a different scale here to show one way we can represent 
            // different units, trillions of dollars instead of billions.
            new c3.Axis.Y({
                label: "GDP in USD",
                orient: 'right',
                scale: d3.scale.linear().domain([0, d3.max(gdp_by_year_data, (d) => d.value / 1000)]),
                tick_label: (n) => "$" + n.toLocaleString() + "t",
                axis_size: 75,
            }),
        ],
    
        // Create the **layers** for this timeline.
        layers: [
            // The first layer is an area graph for the world GDP value.  This doesn't use the 
            // chart's default vertical scale and instead uses its own scale based on the
            // GDP dollars.  The top of the chart is set to the maximum GDP value in our dataset.
            new c3.Plot.Layer.Area<CrossFilter.Grouping<number, number>>({
                options: {
                    title: "GDP",
                    class: 'gdp',
                },
                data: gdp_by_year_data,
                v: d3.scale.linear().domain([0, d3.max(gdp_by_year_data, (d) => d.value)]),
                y: (d) => d.value,
                interpolate: 'cardinal',
            }),
            // Notice how the `class` for each layer is set here. This allows the example
            // to determine how these individual layers appear with an efficient stylesheet and avoid
            // DOM manipulation.  It also allows for dynamically updating the styles, such as when
            // hovering over the cooresponding legend item.
            new c3.Plot.Layer.Line<CrossFilter.Grouping<number, number>>({
                options: {
                    title: "% Services",
                    class: 'services',
                },
                data: services_by_year_data,
            }),
            new c3.Plot.Layer.Line<CrossFilter.Grouping<number, number>>({
                options: {
                    title: "% Manufacturing",
                    class: 'manufacturing',
                },
                data: manufacturing_by_year_data,
            }),
            new c3.Plot.Layer.Line<CrossFilter.Grouping<number, number>>({
                options: {
                    title: "% Agriculture",
                    class: 'agriculture',
                },
                data: agriculture_by_year_data,
            }),

            // This layer represents a **vertical line** for the _currently selected year_.
            new c3.Plot.Layer.Line.Vertical<number>({
                data: [2000],
                draggable: true,

                options: {
                    title: "Selected Year",
                    class: 'selected_year',
                },

                // Setup an **event handler** when the user drags the line
                // to update the filtering to only show data for the selected year.
                // Also update the current year and world population at the time and redraw
                // all charts to reflect the updated dataset filtering.
                handlers: {
                    'drag': function (year) {
                        this.data = [year];
                        year = Math.round(year);
                        year_dim.filter(year);
                        d3.selectAll('#sync_example_year').text(year);
                        d3.selectAll('#total_population').text(d3.format(',')(total_population.value()));
                        redraw();
                    },
                    // Filter the data based on the initial year selection
                    'render': function () {
                        this.handlers['drag'](this.data[0]);
                    },
                },
            }),
        ],
    }));

    // ###########################################################################
    // ### Timeline Legend
    
    // Create a C3 legend and link it with the timeline C3 plot we just created.
    charts.push(new c3.Legend.PlotLegend({
        anchor: '#worldbank_legend',
        plot: timeline,

        // Setup event handlers when hovering over legend items to pulse the opacity 
        // across all charts on the page with the same class as this layer.
        // This demonstrates a way that classes can be used to synchronize related
        // data across the entire page and different visualizations.
        handlers: {
            'layer_mouseenter': (layer) => {
                d3.selectAll('.' + layer.options.class).classed('legend_hover', true);
            },
            'layer_mouseleave': (layer) => {
                d3.selectAll('.' + layer.options.class).classed('legend_hover', false);
            },
        },
    }));

    // ###########################################################################
    // ### Region Table
    
    // Use Crossfilter to get an array of data just like above.  Only, in this case,
    // we are using the `region_dim` dimension instead of the year dimension.  For each region,
    // this grouping will reduce the value based on GDP.
    var gdp_by_region_data = region_dim.group().reduceSum((d) => d.gdp).all();
    
    // Use this D3 utility function to colorize our regions.
    var region_color = d3.scale.category10<number>();
    
    // Create a `c3.Table` for the regions table.
    var regions_table: c3.Table<CrossFilter.Grouping<number, number>>;
    var gdp_column: c3.Table.Column<CrossFilter.Grouping<number, number>>;
    charts.push(regions_table = new c3.Table<CrossFilter.Grouping<number, number>>({
        anchor: '#worldbank_region_table',

        // Bind it to the **data** prepared above.
        // The `key`'s represent region_id`s and the `value`'s represent gdp.
        data: gdp_by_region_data,
        
        // Create two **columns** for this table.  One with the region name and another for the GDP value
        columns: [
            {
                header: { text: "Region" },
                cells: { text: (d) => regions[d.key].name },
            },
            gdp_column = {
                header: { text: "GDP in $b" },
                // Use a custom **html formatter** for the cell contents
                cells: { html: (d) => d3.format(',')(Math.round(Math.abs(d.value))) },
                // The **value** of this cell used for the bar visualization and for sorting.
                value: (d) => Math.abs(d.value),
                // In addition to the html content above also use a C3 `bar` **visualization** of the data
                // This will render a bar graph inside the table cell whose width is based on the cell value.
                // `vis_options.styles` is used to set the color for this bar.
                vis: 'bar',
                vis_options: {
                    styles: {
                        'background-color': (d) => region_color(d.key),
                    },
                },
            },
        ],
        // The initial **sort**.
        sort_column: gdp_column,
        // Allow the user to **select** multiple items in the table
        selectable: 'multi',
        // `row_options` is used to dynamically adjust **rows**.
        // `row_options.classes` will assign CSS **classes** to **rows**.  The class name can be
        // anything you like.  In this example we set the rows to have class `hover` if the row's
        // region is the same as the region the user is hovering over with their mouse or if they
        // are hovering over a country in that region.  The stylesheet then causes any table rows with
        // the class `hover` to have a wheat-colored background.
        row_options: {
            classes: {
                'hover': (d) => regions[d.key] === hover_region || (hover_country && d.key === hover_country.region_id),
            },
            // `row_options.events` will set **event handlers** for **rows** in the table.  Here we set handlers for 
            // when the mouse hovers over the row.  When it does, we record the region the user is hovering
            // over and call `restyle()` to restyle the charts.  This way all of the charts in the example
            // can highlight or somehow indicate this region of interest.
            events: {
                mouseenter: (d) => {
                    hover_region = regions[d.key];
                    restyle();
                },
                mouseleave: (d) => {
                    hover_region = null;
                    restyle();
                },
            },
        },
    }));

    // As an alternative to declaratively setting `handlers` for the chart, you can imperatively call
    // `.on()` to manage event handlers.
    //
    // If the user **selects** one or more rows in the table, then we will 
    // **filter** the data based on those regions using _Crossfilter_.
    // `redraw()` is then used to update the charts based on the updated data.
    regions_table.on('select', (selections) => {
        if (selections && selections.length)
            region_dim.filter((key) => selections.map((d) => d.key).indexOf(key) >= 0);
        else
            region_dim.filterAll();
        redraw();
    });

    
    // ###########################################################################
    // ### Country Scatter Plot
    
    // Now we'll create a fun scatter plot of all of the countries.  For this we want to use the 
    // **country dimension**.  But, we want more than one piece of information about each country.
    // There are multiple ways to do this, and for larger datasets I would use a different approach.
    // However, I wanted to demonstrate here how to use **custom reduction** functions.  Another possible
    // use of custom reduction functions might be to compute an average instead of a sum.
    // `reduce()` takes three callbacks.  The third one is used to initially create the "values" for
    // this grouping.  The first and second are used to add and remove data from those values based
    // on if that data item is filtered in or out.  _Crossfilter_ is surprisingly efficient about this.
    interface CountryData {
        gdp: number;
        gdp_per_capita: number;
        population: number;
        land_area: number;
    }
    var country_data = country_dim.group().reduce<CountryData>(
        function (p, v) {
            p.gdp += v.gdp;
            p.gdp_per_capita += v.gdp_per_capita;
            p.population += v.population;
            p.land_area += v.land_area;
            return p;
        },
        function (p, v) {
            p.gdp -= v.gdp;
            p.gdp_per_capita -= v.gdp_per_capita;
            p.population -= v.population;
            p.land_area -= v.land_area;
            return p;
        },
        function () { return { gdp: 0, gdp_per_capita: 0, population: 0, land_area: 0 }; }
    ).all();
    console.log("country_data", country_data);
    
    // I initially sized the country dots with their area proportional to their population.
    // However, either the smaller countries were too small to see or the larger countries were
    // overwhelming.  So, this is an exponential scale to make it easier to reasonably see all of 
    // the countries at once.  It's a lie, but hey, isn't that what data visualization is...  ;)
    var population_scale = d3.scale.pow()
        .domain([1, d3.max(gdp_data, (d) => d.population)])
        .range([3, 3000])
        .exponent(0.7);
    
    // Create a `c3.Plot` for the **country scatter plot**.
    var average_gdp_layer: c3.Plot.Layer.Line.Horizontal<number>;
    var average_gdp_per_capita_layer: c3.Plot.Layer.Line.Vertical<number>;
    charts.push(new c3.Plot({
        anchor: '#worldbank_country_scatterplot',
        height: 330,
        
        // Setup the **scales** as **logarithmic** for this example.
        // Vertical is based on the country's GDP while horizontal is based on GDP per capita.
        h: d3.scale.log().domain([1, d3.max(gdp_data, (d) => d.gdp_per_capita)]),
        v: d3.scale.log().domain([1, d3.max(gdp_data, (d) => d.gdp)]),
        
        // Setup **margins** and allow the country dots to overflow into the margins.
        margins: {
            top: 20,
        },
        crop_margins: false,
        
        // Add **axes**.  In this case just draw the grid lines and axis label, but disable the 
        // tick marks and unit labels.
        axes: [
            new c3.Axis.X({
                label: "GDP per capita",
                grid: true,
                tick_label: false,
                tick_size: 0,
            }),
            new c3.Axis.Y({
                label: "GDP",
                grid: true,
                tick_label: false,
                tick_size: 0,
            }),
        ],
        
        // This plot only contains a single `scatter` layer for the **scatter plot**.
        layers: [
            new c3.Plot.Layer.Scatter<CrossFilter.Grouping<string, CountryData>>({
                // Bind the layer **data** to the `country_data` prepared above and 
                // only draw the country if it has data using **filter**.
                // The **key** is used to uniquely identify elements which helps optimize
                // some operations and provides consistency for animations and decimation.
                data: country_data,
                key: (d) => d.key,
                filter: (d) => d.value.gdp_per_capita > 1,
                
                // Set the **x** and **y** values based on GDP and GDP per capita.
                x: (d) => Math.max(1, d.value.gdp_per_capita),
                y: (d) => Math.max(1, d.value.gdp),
                
                // Set the area of the circle based on the country's population.
                a: (d) => population_scale(Math.max(1, d.value.population)),
                
                // `circle_options.styles` will set CSS **styles** for the **circles**.  Here we set the fill and 
                // stroke color based on the country's region.  We also set the fill as translucent
                // unless this country matches the country or region the user is hovering over with their mouse.
                circle_options: {
                    styles: {
                        'fill': (d) => region_color(countries[d.key].region_id),
                        'stroke': (d) => region_color(countries[d.key].region_id),
                        'fill-opacity': (d) =>
                            hover_country === countries[d.key] || hover_region === regions[countries[d.key].region_id] ? 1 : 0.5,
                    },
                    // `circle_options.events` establishes **event handlers** for the **circles**.  Here we setup
                    // handlers when the user hovers over the dot with the mouse.  It sets the `hover_country`
                    // and restyles all the charts to reflect this.  It also populates an informational
                    // div in the right column to display information about this particular country.
                    events: {
                        mouseenter: function(d) {
                            d3.select(this).style('stroke-width', 5);
                            d3.select('#hover_country_info').html("\
                                <b>Country:</b> "+ countries[d.key].name + "<br/>\
                               <b>Population:</b> "+ d.value.population + "<br/>\
                               <b>GDP:</b> $"+ Math.floor(Math.abs(d.value.gdp)) + " billion<br/>\
                               <b>GDP per capita:</b> $"+ Math.floor(Math.abs(d.value.gdp_per_capita)));
                            hover_country = countries[d.key];
                            restyle();
                        },
                        mouseleave: function() {
                            d3.select(this).style('stroke-width', 1);
                            d3.select('#hover_country_info').html("<i>Hover over dot to view country info.</i>");
                            hover_country = null;
                            restyle();
                        },
                    },
                },

                // Enable **animations** in this plot so the countries will move smoothly as the year 
                // filter is updated.
                point_options: {
                    animate: true,
                    duration: 200,
                },
            }),
            
            // Add a **horizontal line** layer for the average GDP.
            // Note how the data is actually set in the `redraw_start` event below.
            average_gdp_layer = new c3.Plot.Layer.Line.Horizontal<number>({
                label_options: {
                    text: (avg) => "Avg GDP: $" + d3.format(',')(Math.floor(avg)) + "b",
                    dx: '1em',
                },
                vector_options: {
                    styles: { stroke: 'purple' },
                    animate: true,
                    duration: 500,
                },
            }),
            
            // Add a **vertical line** layer for the average GDP per capita.
            average_gdp_per_capita_layer = new c3.Plot.Layer.Line.Vertical<number>({
                vector_options: {
                    styles: {
                        stroke: (d, i) => i ? 'orange' : 'purple',
                    },
                    animate: true,
                    duration: 500,
                },
            }),
        ],

        // Setup an **event handler** on the chart which fires whenever the chart is redrawn to reflect
        // new data, but before any built-in behaviour.  This allows us to set the data for the average
        // line layers before they are drawn based on the data set due to the current filters.
        handlers: {
            'redraw_start': function () {
                var country_count = country_data.filter((d) => d.value.gdp_per_capita > 1).length;
                if (country_count) {
                    var average_gdp = total_gdp.value() / country_count;
                    var average_gdp_per_capita_by_country = d3.sum(country_data, (d) => d.value.gdp_per_capita) / country_count;
                    var average_gdp_per_capita_by_pop = total_gdp.value() * 1000000000 / total_population.value();
                    average_gdp_layer.data = [average_gdp];
                    average_gdp_per_capita_layer.data = [average_gdp_per_capita_by_pop, average_gdp_per_capita_by_country];
                } else {
                    average_gdp_layer.data = [];
                    average_gdp_per_capita_layer.data = [];
                }
            },
        },
    }));


    // ###########################################################################
    // ### Urbanization Histogram

    // For the urbanization chart we will display the total world GDP but broken down based
    // on the percentage of the country that is urbanized (living in a city of 1 million or more).
    // We'll use the `urban_dim` _Crossfilter_ **dimension** for this.  Notice that in this case
    // we provide a callback function to `group()`.  Previous examples did not do this and just
    // grouped the data based on the dimension's data directly.  Here we are saying that we want
    // to actually **group** the data along that dimension.  This callback effectively groups 
    // countries into groups of 5% increments based on their urbanization.  So, all data for countries
    // with [0-5) percent urbanization are put into one group, countries with [5-10) are put into
    // a second group and so on.
    var gdp_by_urban_data = urban_dim
        .group((key) => Math.floor(key / 5) * 5)
        .reduceSum((d) => d.gdp)
        .all();

    // Create the `c3.Plot.Selectable` for this histogram.  The `selectable: 'h'` enables the
    // user to make horizontal selections in the chart.
    charts.push(new c3.Plot.Selectable<CrossFilter.Grouping<number, number>>({
        anchor: '#worldbank_urbanization_histogram',
        height: 100,
        selectable: 'h',

        data: gdp_by_urban_data,
        // Assign the **class** `urban` to this chart for styling using a stylesheet.
        class: 'urban',
        
        // Setup the **scales** for the chart.  The horizontal scale has a domain from 0-100 to 
        // cover the different urbanization percentages.  With our dataset the data points will
        // only actually fall at intervals of 5.  Note that the domain isn't set here for the
        // vertical scale.  It needs to be set before the chart is rendered, but we do that below
        // in the `redraw_start` event handler.
        h: d3.scale.linear().domain([0, 100]),
        v: d3.scale.linear(),
        
        // **x** and **y** accessors.  With our data `key` is the urbanization percentage and
        // `value` is the GDP.
        x: (d) => d.key,
        y: (d) => d.value > 1 ? d.value : 0,
        
        // Setup **margins** to allow room for the chart labels
        margins: {
            top: 10,
            right: 20,
        },
        crop_margins: false,
        
        // Add **axes** to provide labels and percentage ticks
        axes: [
            new c3.Axis.X({
                label: "Urbanization %",
            }),
            new c3.Axis.Y({
                label: "GDP",
                tick_size: 0,
                tick_label: false,
            }),
        ],
        
        // Layers to render.  This example looks silly, but is just to demonstrate that you can
        // add multiple layers with the same data that are drawn differently.  Here you can see
        // an area layer drawn, a line layer on top of that to accentuate the top of the graph,
        // and then a scatter layer on top of that to show a big dot for each datapoint.
        // The `cardinal` interpolation ensures that the curves actually pass through the datapoint,
        // which is not the case with `basis` curve interpolation.
        layers: [
            new c3.Plot.Layer.Area<CrossFilter.Grouping<number, number>>({
                interpolate: 'cardinal',
            }),
            new c3.Plot.Layer.Line<CrossFilter.Grouping<number, number>>({
                interpolate: 'cardinal',
                r: 5,
            }),
        ],
        
        // Add chart **event handlers**
        handlers: {
            // `redraw_start` is called before C3 starts to actually draw the chart.  We use it here
            // to set the vertical scale each time the chart is drawn so the graph always goes to
            // the top of the chart, no matter how the data is filtered.
            redraw_start: function () {
                this.v.domain([0, d3.max(gdp_by_urban_data, (d) => d.value)]);
            },
            
            // `select` is triggered whenever the user makes or modifies a selection in the chart.
            // We use that here to **filter** out the data based on the urbanization dimension.
            select: function (extent) {
                if (extent) {
                    extent[1]++;
                    urban_dim.filterRange(extent);
                } else {
                    urban_dim.filterAll();
                }
                redraw();
            },
        },
    }));
    
    
    // ###########################################################################
    // ### Histograms

    // Instead of adding the charts to a _div_ node in the DOM, this section will demonstrate
    // another way to layout charts in a table on a web page.  You can use whatever HTML layout you prefer.

    // This is a function that will create a row in the table with a label column and a column
    // with the cooresponding C3 histogram based on the dimension and histogram data passed in.
    function histogram_plot(name: string,
        dimension: CrossFilter.Dimension<GDPData, number>,
        hist_data: CrossFilter.Grouping<number, number>[]) {
        var row = d3.selectAll('#worldbank_histogram_table').append('tr')
            .style('border-top', '1px solid black')
            .style('border-bottom', '1px solid black');
        row.append('td')
            .style('text-align', 'center')
            .style('font-weight', 'bold')
            .style('background-color', 'lightgray')
            .style('width', '5em')
            .text(name);

        // Create new **histogram** chart returned by this factory function.
        return new c3.Plot.Selectable<CrossFilter.Grouping<number, number>>({
            anchor: <HTMLElement>row.append('td').append('div').node(),
            height: 75,
            selectable: 'h',

            data: hist_data,
            
            // **Scales** for the histogram.  The horizontal scale goes from 0-100% for the histogram.
            // The vertical scale reflects the count of countries that fall in that percentage, though
            // it is set below in the `redraw_start` handler.
            h: d3.scale.linear().domain([0, 100]),
            v: d3.scale.linear(),
            
            // **x** and **y** accessors.  `key` represents the percentage of GDP based on this
            // dimension and `value` represents the count of countries with that percentage.
            x: (d) => d.key,
            y: (d) => d.value,
            
            // Notice there are no axes added here, that is covered below.
            
            // Add a **layer** to draw an area graph for the histogram.  By assigning it a **class**
            // based on the dimension name the stylesheet will specify how it is styled.  It also
            // allows these layers to be highlighted when the legend at the top of the example is hovered.
            // The `cardinal` interpolation ensures that the curve actually intersects each datapoint.
            layers: [
                new c3.Plot.Layer.Area<CrossFilter.Grouping<number, number>>({
                    class: name,
                    interpolate: 'cardinal',
                }),
            ],
            
            // Add chart **event handlers**
            handlers: {
                // `redraw_start` is called before C3 starts to actually draw the chart.  We use it here
                // to set the vertical scale each time the chart is drawn so the graph always goes to
                // the top of the chart, no matter how the data is filtered.
                redraw_start: function () {
                    this.v.domain([0, d3.max(hist_data, (d) => d.value)]);
                },
                
                // `select` is triggered whenever the user makes or modifies a selection in the chart.
                // We use that here to **filter** out the data based on this dimension.
                select: function (extent) {
                    if (extent) {
                        extent[1]++;
                        dimension.filterRange(extent);
                    } else {
                        dimension.filterAll();
                    }
                    redraw();
                },
            },
        });
    }
    
    // For these histograms we will display a histogram of the count of countries based on the
    // percentage of their GDP based on services, agriculture, etc.  Notice that these **groupings**
    // are missing calls to `reduceSum()`.  Therefore they use the default reduction which just counts
    // the number of data elements in each group.  This effectively gives us a histogram.  The 
    // grouping function here will also group countries into groups of 5% just like the urbanization example.
    var services_hist = services_dim.group((key) => Math.floor(key / 5) * 5).all();
    var agriculture_hist = agriculture_dim.group((key) => Math.floor(key / 5) * 5).all();
    var manufacturing_hist = manufacturing_dim.group((key) => Math.floor(key / 5) * 5).all();

    // Create three rows in the table with histogram charts for each of these dimensions.
    charts.push(histogram_plot('services', services_dim, services_hist));
    charts.push(histogram_plot('manufacturing', manufacturing_dim, manufacturing_hist));
    charts.push(histogram_plot('agriculture', agriculture_dim, agriculture_hist));
    
    // Previous examples usually attached axes directly to their associated plot.  This example
    // demonstrates a different way of laying out the charts.  To provide flexibility, axes can be
    // created independently of plots.  This example creates a single X-Axis that is added to the
    // table and thus shared by all three histograms.
    var axis_row = d3.selectAll('#worldbank_histogram_table').append('tr');
    axis_row.append('td');
    charts.push(new c3.Axis.X({
        anchor: <HTMLElement>axis_row.append('td').append('div').node(),
        height: 30,
        scale: d3.scale.linear().domain([0, 100]),
    }));


    // #########################################################################################
    // ## Country Table
    
    // Create a second dimension to filter on so the scatter plot will reflect this filter.
    var country_dim2 = xf.dimension((d) => d.country_code);
    var country_data2 = country_dim2.group().reduce<CountryData>(
        function (p, v) {
            p.gdp += v.gdp;
            p.gdp_per_capita += v.gdp_per_capita;
            p.population += v.population;
            p.land_area += v.land_area;
            return p;
        },
        function (p, v) {
            p.gdp -= v.gdp;
            p.gdp_per_capita -= v.gdp_per_capita;
            p.population -= v.population;
            p.land_area -= v.land_area;
            return p;
        },
        function () { return { gdp: 0, gdp_per_capita: 0, population: 0, land_area: 0 }; }
    ).all();

    // Create a `c3.Table` to show the top countries
    var country_gdp_column: c3.Table.Column<CrossFilter.Grouping<string, CountryData>>;
    charts.push(new c3.Table<CrossFilter.Grouping<string, CountryData>>({
        anchor: '#worldbank_country_table',
        width: '100%',
        data: country_data2,
        
        // Enable users to **select** and **sort** countries in this table.
        selectable: true,
        sortable: true,
        
        // **Limit** this table to only show the top 10 countries and not to display any countries
        // that have a 0 value.
        limit_rows: 10,
        filter: (d) => d.value.gdp > 0.000000001,
        
        // Setup **columns** for this table
        columns: [
            {
                header: { text: "Country" },
                cells: { html: (d) => '<b>' + countries[d.key].name + '</b>' },
            }, {
                // The "Region" column is styled to have a background that matches the color for the
                // region this country is in.
                header: { text: "Region" },
                cells: {
                    text: (d) => regions[countries[d.key].region_id].name,
                    styles: {
                        'background-color': (d) => region_color(countries[d.key].region_id),
                    },
                },
            }, {
                // These columns use custom formatters to set the html content of the cell 
                // adding commas, units, rounding, etc.  You can add raw HTML if you like.
                // These column also use the `vis` visualization support to render a bar
                // graph based on the cell value.
                header: { text: "Population" },
                cells: { html: (d) => d3.format(',')(d.value.population) },
                sort: (d) => d.value.population,
                vis: 'bar',
            }, {
                header: { text: "Land Area" },
                cells: { html: (d) => (d3.format(',')(Math.round(d.value.land_area))) + "km<sup>2</sup>" },
                sort: (d) => Math.round(d.value.land_area),
                vis: 'bar',
            },
            // Assign this column to a variable `gdp_column` so we can refer to it below for setting the default sort.
            country_gdp_column = {
                header: { text: "GDP" },
                cells: { html: (d) => "$" + (d3.format(',')(Math.round(d.value.gdp))) + "b" },
                sort: (d) => Math.round(d.value.gdp),
                vis: 'bar',
            }, {
                // By default, the `bar` visualization will base the bar width as a percentage of the
                // total value of all cells.  This isn't always appropriate, though, such as in the case
                // of GDP per capita.  So, here we manually set the `total_value` to be the maximum
                // per capita value.  Look out for Monaco!
                header: { text: "GDP per capita" },
                cells: { html: (d) => "$" + (d3.format(',')(Math.round(d.value.gdp_per_capita))) },
                sort: (d) => Math.round(d.value.gdp_per_capita),
                vis: 'bar',
                total_value: function () { return d3.max(country_data2, (d) => d.value.gdp_per_capita); },
            },
        ],
        // Initial column to **sort** on.
        sort_column: country_gdp_column,
        
        // Add some padding to each cell using `cell_options.styles` to assign **styles** to **cells**
        cell_options: {
            styles: {
                padding: "0 0.25em",
            },
        },
        
        // Use `row_options.classes` to enable **CSS classes** on table **rows**.  The classes can be
        // whatever class you want for your styling.  Here we turn on the `hover` class if this
        // country matches the country the user is hovering over or is in the region the use is 
        // hovering over with their mouse.  The stylesheet will then dictate how these rows appear;
        // in this case giving them a wheat-colored background.
        row_options: {
            classes: {
                hover: (d) => hover_country === countries[d.key] || hover_region === regions[countries[d.key].region_id],
            },
        
            // `row_options.events` adds **event handlers** to table **rows**.  These handlers set the global
            // hover country when the user hovers the mouse over a row.  `restyle()` is then called
            // for all charts to update based on this new focus country.
            events: {
                mouseenter: (d) => {
                    hover_country = countries[d.key];
                    restyle();
                },
                mouseleave: (d) => {
                    hover_country = null;
                    restyle();
                },
            },
        },
        
        // `handlers` adds **event handlers** to the chart object itself.  Here we tie into the
        // `select` event when the user selects one or more row to **filter** the data on only that country.
        // _Note_: While all the other charts will filter to only display the filtered country the
        // country scatter plot will still display all countries.  This is because when you filter
        // on a particular dimension it affects all _other_ dimensinos, but _not_ the one used to filter.
        // This is actually a very good thing, otherwise when you filtered on a chart or table all
        // of the data outside of that selection would then disappear which would be awkward and hard
        // to change the selection.  If we wanted the country scatter plot to only show the filtered
        // country, the solution would be easy: just make another dimension and use different ones for
        // the scatter plot and this table.
        handlers: {
            'select': (selections) => {
                if (selections.length)
                    country_dim2.filter((key) => selections.map((d) => d.key).indexOf(key) >= 0);
                else
                    country_dim2.filterAll();
                redraw();
            },
        },
    }));
    
    // #########################################################################################
    // ### Initial Rendering
    
    // Perform the initial `render()`
    for (let chart of charts)
        chart.render();

    // **Resize** charts if the window is resized.
    window.onresize = function () {
        for (let chart of charts)
            chart.resize();
    }
}


// #########################################################################################
// # Start Here

// The loading and rendering are initiated here..  It calls the `download_data()` function to 
// download the data which returns a Promise.  We setup a _then_ callback function to be 
// called when all of the data is loaded and promised.  This callback function calls which ends up 
// calling the `render()` function.
download_data().then(function () { setTimeout(render, 0); });
// The reason to have setTimeout call the render function instead of calling it directly is
// just a trick to help with debugging in the browser when using promises.  The callback function
// for a promise is called, which catches all exceptions to be used to call an error callback.
// This is great except unhandled errors are then reported to the debugger later after we are already
// out of the context of the error.  So, you can't navigate the stack, view the contents of variables, 
// etc.  By using setTimeout it will cause the callback to return immediatly and then the browser
// will call render itself.  Since this is done outside of the promise's scope, exceptions are not caught and
// passed to the promise error handler and instead can be caught and handeled as normal in a 
// debugger.  In production code you could use this instead:

//     download_data().then(render)
