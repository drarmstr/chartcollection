// # C3 Table
// _A simple data table example with three columns that is sortable._

// ## Create the Data Table
// Create a `c3.Table` object and set its options.  Bind to an **anchor** DOM element using a _string selector_.
var table = new c3.Table({
    anchor: '#table_example',

    // Specify the **width** to set the anchor node.  Setting the height and width is optional.
    width: 250,

    // The raw **data** to visualize.  The data must be provided as an array.
    data: [0, 1, 2, 3, 4],

    // Only include data elements that are greater than 0
    filter: (d) => d > 0,

    // Enable the user to **sort** this table.
    sortable: true,

    // Create an array of **column** objects to describe the table columns.
    columns: [

        // The first column `header` is labeled "x".The `cells.text` callback describes
        // how to generate the text content for the cells based on the data.
        // `sortable` enables **sorting** for this column based on the **value** of the `value` callback.
        {
            header: { text: "x" },
            cells: {
                text: (d) => d,
                styles: { color: 'darkblue' }
            },
            value: (d) => d,
            sortable: true,
        },

        // Create a second column that displays the data value squared for each row.
        {
            header: { html: "x<sup>2</sup>" },
            cells: { text: (d) => d * d },
            value: (d) => d * d,
            sortable: true,
        },

        // Create a third column that displays the negative data value for each row.
        {
            header: { text: "-x" },
            cells: { text: (d) => -d },
            value: (d) => -d,
            sortable: true,
        },
    ],

    // Configure the initial column to **sort** the data on based on the column
    // with the header text "x".
    sort_column: 'x',
});

// Render the table!
table.render();
