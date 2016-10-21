// # C3 Table
// _A simple data table example with that is selectable._
// ## Create the Data Table
// Create a `c3.Table` object and set its options.Bind to an **anchor** DOM element using a _string selector_.
var table = new c3.Table({
    anchor: '#table_example',
    // Specify the **width** to set the anchor node.Setting the height and width is optional.
    width: 250,
    // The raw **data** to visualize.  The data must be provided as an array.
    data: [0, 1, 2, 3, 4],
    // Only include data elements that are greater than 0
    filter: function (d) { return d > 0; },
    // Enable the user to **select** rows in this table.
    selectable: 'multi',
    // Create an array of **column ** objects to describe the table columns.
    columns: [
        // The first column `header` is labeled "x".  The `cells.text` callback describes
        // how to generate the text content for the cells based on the data.
        {
            header: { text: "x" },
            cells: {
                text: function (d) { return d; },
                styles: { color: 'darkblue' }
            },
            value: function (d) { return d; },
            vis: 'bar',
            total_value: 5
        },
        // Create a second column that displays the data value squared for each row.
        {
            header: { html: "x<sup>2</sup>" },
            cells: { text: function (d) { return d * d; } },
            value: function (d) { return d * d; }
        },
        // Create a third column that displays the negative data value for each row.
        {
            header: { text: "-x" },
            cells: { text: function (d) { return -d; } },
            value: function (d) { return -d; }
        },
    ],
    // Setup **event handler** to do something with the selection.
    // This could also have been added imperatively with `table.on('select', function(selections) { ... });`
    handlers: {
        'select': function (selections) {
            document.querySelector('#current_selection').innerText = selections;
        }
    }
});
// Render the table!
table.render();
// ## Set table selectability
// Change the table selectability mode
$('input[name=selectable]').on('change', function () {
    var value = $('input[name=selectable]:checked').val();
    switch (value) {
        case 'true':
            table.selectable = true;
            break;
        case 'false':
            table.selectable = false;
            break;
        default: table.selectable = value;
    }
    table.render();
});
