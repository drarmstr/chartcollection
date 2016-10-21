// # C3 Scatter Plot
// _This example covers a scatter plot using different C3 concepts as discussed in the
// API Overview._
var student_id = 0;
// Create **student_data** _array_.
var student_data = [
    { name: "Joe", id: ++student_id, gender: "male", age: 16, grade: 3.2 },
    { name: "Lisa", id: ++student_id, gender: "female", age: 18, grade: 2.3 },
    { name: "Patrick", id: ++student_id, gender: "male", age: 28, grade: 1.4 },
    { name: "Mandy", id: ++student_id, gender: "female", age: 32, grade: 3.8 },
    { name: "Tommy", id: ++student_id, gender: "male", age: 9, grade: 1.7 },
];
// ## Scatter Plot
// Create the **scatter plot** and attach to the DOM.
var my_chart = new c3.Plot({
    anchor: '#scatter_plot_example',
    height: 300,
    width: '50%',
    // ### Scales
    // Setup the **scales** for student ages 0-50 and grades 0-4.
    h: d3.scale.linear().domain([0, 50]),
    v: d3.scale.linear().domain([0, 4]),
    // ### Axes
    // Add **margins** and disable **cropping** so the dots can extend past the edge of the plot.
    margins: 10,
    crop_margins: false,
    // Add **axes** for grid lines and labels
    axes: [
        new c3.Axis.X({
            grid: true,
            label: "Age"
        }),
        // The y axis will display letter grades
        new c3.Axis.Y({
            grid: true,
            label: "Grade",
            tick_values: [0, 1, 2, 3, 4],
            // Create a **quantize scale** to translate from numeric to letter grades.
            tick_label: d3.scale.quantize()
                .domain([0, 4])
                .range(['F', 'D', 'C', 'B', 'A'])
        }),
    ],
    // ### Layers
    // Setup the plot **layers**
    layers: [
        // Create a `c3.Plot.Layer.Scatter` **scatter layer**
        new c3.Plot.Layer.Scatter({
            // ### Data set accessors
            // Bind with student **data**
            data: student_data,
            // **key** accessor to assign unique id.
            // This aids in animations when students are added and removed.
            key: function (student) { return student.id; },
            // Accessors for **x** and **y** positions based on the age and grade of the students.
            x: function (student) { return student.age; },
            y: function (student) { return student.grade; },
            // All dots have a **radius** of 10
            r: 10,
            // **Filter** data for underage students
            filter: function (student) { return student.age >= 16; },
            // ## Selection Options
            // Enable **animation** in the chart when updating data
            point_options: {
                animate: true,
                duration: 1000
            },
            // Enable **labels**
            label_options: {
                text: function (student) { return student.grade.toFixed(1); },
                styles: {
                    'fill': function (student) { return student.gender === 'male' ? "white" : "black"; },
                    'font-size': "x-small"
                }
            },
            circle_options: {
                // ## Styles
                // Set CSS **classes** based on the data.  There is a corresponding CSS rule in 
                // the `<style>` section of the example's HTML to give failing students a red stroke.
                classes: {
                    'passing': function (student) { return student.grade >= 2; },
                    'failing': function (student) { return student.grade < 2; }
                },
                // **Style** the circles by **coloring** the dots based on the student's gender
                styles: {
                    'fill': function (student) { return student.gender === 'male' ? "blue" : "pink"; }
                },
                // ## Event Handlers
                // Add **event** handlers to expand the size of the circle when the user hovers over
                // them and displays detailed student information for that particular 
                // student in an info box elsewhere on the page.
                events: {
                    'mouseenter': function (student) {
                        d3.select('#info_box').html("<b>" + student.name + "</b> " +
                            (student.gender === 'male' ? 'm' : 'f') + "<br/>" +
                            "age: " + Math.round(student.age) + "<br/>" +
                            "grade: " + Math.round(student.grade * 10) / 10);
                        d3.select(this).transition().duration(500).attr('r', 20);
                    },
                    'mouseleave': function () {
                        d3.select('#info_box').html("<i>Hover over student to view info</i>");
                        d3.select(this).transition().duration(500).attr('r', 10);
                    },
                    // Add `click` **event** to delete an existing student.
                    // `redraw()` must be called for the chart to reflect the updated dataset.
                    'click': function (student) {
                        var index = student_data.indexOf(student);
                        if (index >= 0) {
                            alert("Deleting " + student.name);
                            student_data.splice(student_data.indexOf(student), 1);
                            my_chart.redraw();
                        }
                        d3.event.stopPropagation();
                    }
                }
            }
        }),
        // Create a horizontal line **layer** for the class grade average.
        new c3.Plot.Layer.Line.Horizontal({
            data: [],
            // Assign the layer with the CSS **class** `average-grade`.
            // There is a corresponding CSS rule in the HTML `<style>` to give this layer a purple stroke.
            class: 'average-grade',
            // Give the line a **label**.
            label_options: {
                text: function (grade) { return "Avg Grade: " + grade.toFixed(2); }
            },
            // ### Extend Custom Functionality
            // Extend custom functionality with a **handler** to update the layer's data based on the
            // average grade of the class by adding a `redraw_start` callback to the layer.  This is called
            // everytime the data is updated or resized, but before any built-in functionality, so you can
            // use it to update the dataset in advance.
            handlers: {
                redraw_start: function () {
                    var students = student_data.filter(function (student) { return student.age >= 16; });
                    var average_grade = d3.sum(students, function (student) { return student.grade; }) / students.length;
                    this.data = isNaN(average_grade) ? [] : [average_grade];
                }
            }
        }),
    ],
    // Setup **handlers** to extend custom functionality
    handlers: {
        // Add a **render** callback to add _guidelines_ to track cursor movement using D3.
        // `render` is used for custom initialization and is only called once when the plot is first rendered.
        render: function () {
            this.content.all.append('line').attr('class', 'guideline x');
            this.content.all.append('line').attr('class', 'guideline y');
            this.content.all.selectAll('line.guideline')
                .style('display', 'none')
                .style('stroke', 'orange')
                .style('pointer-events', 'none')
                .style('shape-rendering', 'crispEdges');
        },
        // Add a **resize** callback to properly size the _guidelines_.
        // `resize` is called whenever the chart is resized.
        resize: function () {
            this.content.all.selectAll('line.guideline.x').attr('y2', this.content.height);
            this.content.all.selectAll('line.guideline.y').attr('x2', this.content.width);
        }
    },
    content_options: {
        // Add **event** callbacks for custom behavior.
        events: {
            // Setup `mousemove` and `mouseleave` event callbacks to track the mouse movement
            // with the _guidelines_.
            //
            // Note use of [`d3.mouse()`](https://github.com/mbostock/d3/wiki/Selections#d3_mouse) to identify the mouse location.
            'mousemove': function () {
                var _a = d3.mouse(this), x = _a[0], y = _a[1];
                my_chart.content.all.selectAll('line.guideline.x')
                    .style('display', '')
                    .attr('x1', x)
                    .attr('x2', x);
                my_chart.content.all.selectAll('line.guideline.y')
                    .style('display', '')
                    .attr('y1', y)
                    .attr('y2', y);
            },
            'mouseleave': function () {
                my_chart.content.all.selectAll('line.guideline')
                    .style('display', 'none');
            },
            // Setup a `click` **event** handler to add a new student with an age and grade based
            // on where the user clicked.
            'click': function () {
                var _a = d3.mouse(this), x = _a[0], y = _a[1];
                var student = {
                    name: d3.scale.quantize().range(["Chris", "Alex", "Pat", "Ryan"])(Math.random()),
                    id: ++student_id,
                    gender: Math.random() > 0.5 ? 'male' : 'female',
                    age: my_chart.h.invert(x),
                    grade: my_chart.v.invert(y)
                };
                if (student.age < 16)
                    alert("Student is too young to track");
                else {
                    student_data.push(student);
                    my_chart.redraw();
                }
            }
        }
    }
});
// ## Render
// Render your chart
my_chart.render();
// ## Resize
// Resize the chart when the window is resized
window.onresize = function () {
    my_chart.resize();
};
// ## Data update and redraw
// Randomly adjust the student grades and call `redraw()` to update.  Because we 
// enabled **animation** in this chart, the student dots will smoothly transition to
// their new locations.
d3.select('#event_regrade_button').on('click', function () {
    for (var _i = 0, student_data_1 = student_data; _i < student_data_1.length; _i++) {
        var student = student_data_1[_i];
        student.grade += 2 * Math.random() - 1;
        if (student.grade > 4)
            student.grade -= (student.grade - 4) * 2;
        if (student.grade < 0)
            student.grade += -student.grade * 2;
    }
    my_chart.redraw();
});
