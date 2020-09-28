// # C3 Butterfly Dark Family Tree
// _Demonstrates a Butterfly Caller/Callee flow chart for a family tree based on time travel for the Netflix series "Dark"_.
var world = 'jonas';
var season = 1;
// Example data sets
var family_datasets = {
    jonas: {
        relations: [
            { parent: 'Elisabeth Doppler', child: 'Charlotte Doppler', season: 2 },
            { parent: 'Noah', child: 'Charlotte Doppler', season: 2 },
            { parent: 'Charlotte Doppler', child: 'Elisabeth Doppler', season: 1 },
            { parent: 'Peter Doppler', child: 'Elisabeth Doppler', season: 1 },
            { parent: 'Charlotte Doppler', child: 'Franziska Doppler', season: 1 },
            { parent: 'Peter Doppler', child: 'Franziska Doppler', season: 1 },
            { parent: 'Helge Doppler', child: 'Peter Doppler', season: 1 },
            { parent: 'Ulla Schmidt', child: 'Peter Doppler', season: 3 },
            { parent: 'Greta Doppler', child: 'Helge Doppler', season: 1 },
            { parent: 'Bernd Doppler', child: 'Helge Doppler', season: 1 },
            { parent: 'Katharina Nielsen', child: 'Magnus Nielsen', season: 1 },
            { parent: 'Ulrich Nielsen', child: 'Magnus Nielsen', season: 1 },
            { parent: 'Katharina Nielsen', child: 'Martha Nielsen', season: 1 },
            { parent: 'Ulrich Nielsen', child: 'Martha Nielsen', season: 1 },
            {
                parent: 'Katharina Nielsen',
                child: 'Mikkel Nielsen / Michael Kahnwald', season: 1
            },
            {
                parent: 'Ulrich Nielsen',
                child: 'Mikkel Nielsen / Michael Kahnwald', season: 1
            },
            {
                parent: 'Mikkel Nielsen / Michael Kahnwald',
                child: 'Jonas Kahnwald', season: 1
            },
            { parent: 'Hannah Kahnwald', child: 'Jonas Kahnwald', season: 1 },
            {
                parent: 'Ines Kahnwald',
                child: 'Mikkel Nielsen / Michael Kahnwald', season: 1,
                type: 'adopted'
            },
            { parent: 'Daniel Kahnwald', child: 'Ines Kahnwald', season: 1 },
            { parent: 'Helene Albers', child: 'Katharina Nielsen', season: 3 },
            { parent: 'Hermann Albers', child: 'Katharina Nielsen', season: 3 },
            { parent: 'Sebastian Kruger', child: 'Hannah Kahnwald', season: 3 },
            { parent: 'Hannah Kahnwald', child: 'Silja Tiedemann', season: 3 },
            { parent: 'Egon Tiedemann', child: 'Silja Tiedemann', season: 3 },
            { parent: 'Egon Tiedemann', child: 'Claudia Tiedemann', season: 1 },
            { parent: 'Doris Tiedemann', child: 'Claudia Tiedemann', season: 1 },
            { parent: 'Claudia Tiedemann', child: 'Regina Tiedemann', season: 1 },
            { parent: 'Bernd Doppler', child: 'Regina Tiedemann', season: 3 },
            { parent: 'Aleksander Tiedemann', child: 'Bartosz Tiedemann', season: 1 },
            { parent: 'Regina Tiedemann', child: 'Bartosz Tiedemann', season: 1 },
            { parent: 'Bartosz Tiedemann', child: 'Noah', season: 3 },
            { parent: 'Silja Tiedemann', child: 'Noah', season: 3 },
            { parent: 'Bartosz Tiedemann', child: 'Agnes Nielsen', season: 3 },
            { parent: 'Silja Tiedemann', child: 'Agnes Nielsen', season: 3 },
            { parent: 'Jana Nielsen', child: 'Ulrich Nielsen', season: 1 },
            { parent: 'Jana Nielsen', child: 'Mads Nielsen', season: 1 },
            { parent: 'Tronte Nielsen', child: 'Ulrich Nielsen', season: 1 },
            { parent: 'Tronte Nielsen', child: 'Mads Nielsen', season: 1 },
            { parent: 'Agnes Nielsen', child: 'Tronte Nielsen', season: 1 },
            { parent: 'The Unknown', child: 'Tronte Nielsen', season: 3 },
            { parent: 'Jonas Kahnwald', child: 'The Unknown', season: 3 },
            { parent: 'Martha Nielsen', child: 'The Unknown', season: 3 },
            { parent: 'Leopold Tannhaus', child: 'H.G. Tannhaus', season: 3 },
            { parent: 'Gustav Tannhaus', child: 'Leopold Tannhaus', season: 3 },
            { parent: 'Heinrich Tannhaus', child: 'Gustav Tannhaus', season: 3 },
            { parent: 'H.G. Tannhaus', child: 'Charlotte Doppler', season: 2, type: 'adopted' },
            { parent: 'H.G. Tannhaus', child: 'Marek Tannhaus', season: 3 },
            { parent: 'Marek Tannhaus', child: 'Charlotte Tannhaus', season: 3 },
            { parent: 'Sonja Tannhaus', child: 'Charlotte Tannhaus', season: 3 },
        ],
        names: []
    },
    martha: {
        relations: [
            { parent: 'Elisabeth Doppler', child: 'Charlotte Doppler', season: 3 },
            { parent: 'Noah', child: 'Charlotte Doppler', season: 3 },
            { parent: 'Charlotte Doppler', child: 'Elisabeth Doppler', season: 3 },
            { parent: 'Peter Doppler', child: 'Elisabeth Doppler', season: 3 },
            { parent: 'Charlotte Doppler', child: 'Franziska Doppler', season: 3 },
            { parent: 'Peter Doppler', child: 'Franziska Doppler', season: 3 },
            { parent: 'Helge Doppler', child: 'Peter Doppler', season: 3 },
            { parent: 'Ulla Schmidt', child: 'Peter Doppler', season: 3 },
            { parent: 'Greta Doppler', child: 'Helge Doppler', season: 3 },
            { parent: 'Bernd Doppler', child: 'Helge Doppler', season: 3 },
            { parent: 'Katharina Nielsen', child: 'Magnus Nielsen', season: 3 },
            { parent: 'Ulrich Nielsen', child: 'Magnus Nielsen', season: 3 },
            { parent: 'Katharina Nielsen', child: 'Martha Nielsen', season: 3 },
            { parent: 'Ulrich Nielsen', child: 'Martha Nielsen', season: 3 },
            {
                parent: 'Katharina Nielsen',
                child: 'Mikkel Nielsen / Michael Kahnwald', season: 3
            },
            {
                parent: 'Ulrich Nielsen',
                child: 'Mikkel Nielsen / Michael Kahnwald', season: 3
            },
            { parent: 'Daniel Kahnwald', child: 'Ines Kahnwald', season: 3 },
            { parent: 'Helene Albers', child: 'Katharina Nielsen', season: 3 },
            { parent: 'Hermann Albers', child: 'Katharina Nielsen', season: 3 },
            { parent: 'Sebastian Kruger', child: 'Hannah Kahnwald', season: 3 },
            { parent: 'Hannah Kahnwald', child: 'Silja Tiedemann', season: 3 },
            { parent: 'Egon Tiedemann', child: 'Silja Tiedemann', season: 3 },
            { parent: 'Egon Tiedemann', child: 'Claudia Tiedemann', season: 3 },
            { parent: 'Doris Tiedemann', child: 'Claudia Tiedemann', season: 3 },
            { parent: 'Claudia Tiedemann', child: 'Regina Tiedemann', season: 3 },
            { parent: 'Bernd Doppler', child: 'Regina Tiedemann', season: 3 },
            { parent: 'Aleksander Tiedemann', child: 'Bartosz Tiedemann', season: 3 },
            { parent: 'Regina Tiedemann', child: 'Bartosz Tiedemann', season: 3 },
            { parent: 'Bartosz Tiedemann', child: 'Noah', season: 3 },
            { parent: 'Silja Tiedemann', child: 'Noah', season: 3 },
            { parent: 'Bartosz Tiedemann', child: 'Agnes Nielsen', season: 3 },
            { parent: 'Silja Tiedemann', child: 'Agnes Nielsen', season: 3 },
            { parent: 'Jana Nielsen', child: 'Ulrich Nielsen', season: 3 },
            { parent: 'Jana Nielsen', child: 'Mads Nielsen', season: 3 },
            { parent: 'Tronte Nielsen', child: 'Ulrich Nielsen', season: 3 },
            { parent: 'Tronte Nielsen', child: 'Mads Nielsen', season: 3 },
            { parent: 'Agnes Nielsen', child: 'Tronte Nielsen', season: 3 },
            { parent: 'The Unknown', child: 'Tronte Nielsen', season: 3 },
            { parent: 'Martha Nielsen', child: 'The Unknown', season: 3 },
            { parent: 'Leopold Tannhaus', child: 'H.G. Tannhaus', season: 3 },
            { parent: 'Gustav Tannhaus', child: 'Leopold Tannhaus', season: 3 },
            { parent: 'Heinrich Tannhaus', child: 'Gustav Tannhaus', season: 3 },
            { parent: 'H.G. Tannhaus', child: 'Charlotte Doppler', season: 3, type: 'adopted' },
            { parent: 'H.G. Tannhaus', child: 'Marek Tannhaus', season: 3 },
            { parent: 'Marek Tannhaus', child: 'Charlotte Tannhaus', season: 3 },
            { parent: 'Sonja Tannhaus', child: 'Charlotte Tannhaus', season: 3 },
        ]
    },
    origin: {
        relations: [
            { parent: 'Helge Doppler', child: 'Peter Doppler', season: 3 },
            { parent: 'Ulla Schmidt', child: 'Peter Doppler', season: 3 },
            { parent: 'Greta Doppler', child: 'Helge Doppler', season: 3 },
            { parent: 'Bernd Doppler', child: 'Helge Doppler', season: 3 },
            { parent: 'Daniel Kahnwald', child: 'Ines Kahnwald', season: 3 },
            { parent: 'Helene Albers', child: 'Katharina Nielsen', season: 3 },
            { parent: 'Hermann Albers', child: 'Katharina Nielsen', season: 3 },
            { parent: 'Sebastian Kruger', child: 'Hannah Kahnwald', season: 3 },
            { parent: 'Egon Tiedemann', child: 'Claudia Tiedemann', season: 3 },
            { parent: 'Doris Tiedemann', child: 'Claudia Tiedemann', season: 3 },
            { parent: 'Claudia Tiedemann', child: 'Regina Tiedemann', season: 3 },
            { parent: 'Bernd Doppler', child: 'Regina Tiedemann', season: 3 },
            { parent: 'H.G. Tannhaus', child: 'Marek Tannhaus', season: 3 },
            { parent: 'Leopold Tannhaus', child: 'H.G. Tannhaus', season: 3 },
            { parent: 'Gustav Tannhaus', child: 'Leopold Tannhaus', season: 3 },
            { parent: 'Heinrich Tannhaus', child: 'Gustav Tannhaus', season: 3 },
            { parent: 'Marek Tannhaus', child: 'Charlotte Tannhaus', season: 3 },
            { parent: 'Sonja Tannhaus', child: 'Charlotte Tannhaus', season: 3 },
        ]
    }
};
['jonas', 'martha', 'origin'].forEach(function (world) {
    var names = new Set();
    for (var _i = 0, _a = family_datasets[world].relations; _i < _a.length; _i++) {
        var relation = _a[_i];
        names.add(relation.parent);
        names.add(relation.child);
    }
    family_datasets[world].names = Array.from(names);
});
// A Scale to generate colors for each name.
var family_name_color = d3.scale.category10();
var name_color = function (fullName) {
    var names = fullName.split(' ');
    return family_name_color(names[names.length - 1]);
};
// # Create Butterfly visualization
// Create `Butterfly` visualization object
var family_tree = new c3.Sankey.Butterfly({
    // Bind to the DOM and set height.
    anchor: '#dark_tree',
    height: 800,
    // Define unique **key** accessors
    key: function (name) { return name; },
    link_key: function (relation) { return relation.parent + '/' + relation.child; },
    link_value: function () { return 1; },
    link_source: function (relation) { return relation.parent; },
    link_target: function (relation) { return relation.child; },
    // **Align** tree to start on the `left`
    align: 'left',
    // **Overflow** to the right if the nodes would become too crowded.
    overflow_width_ratio: 0.5,
    node_padding: '75%',
    // **Style** nodes based on the name and create tooltips.
    // **Animate** transitions for all of the nodes and links.
    node_options: {
        title: function (name) { return name; },
        animate: true,
        duration: 3000
    },
    rect_options: {
        styles: {
            fill: function (name) { return name_color(name); }
        },
        animate: true,
        duration: 3000
    },
    link_options: {
        title: function (link) { return link.parent + " → " + link.child; },
        styles: {
            stroke: function (link) { return d3.interpolateRgb(name_color(link.parent), name_color(link.child))(0.5); }
        },
        animate: true,
        duration: 3000
    },
    path_options: {
        styles: {
            'stroke-dasharray': function (link) { return link.type === 'adopted' ? 4 : null; }
        },
        animate: true,
        duration: 3000
    },
    // Add text **labels** for each node
    node_label_options: {
        text: function (name) { return name; },
        orientation: 'horizontal',
        animate: true,
        duration: 3000
    }
});
function setData() {
    family_tree.data = family_datasets[world].names;
    family_tree.links = family_datasets[world].relations.filter(function (r) { return r.season <= season; });
}
setData();
family_tree.render();
// ## Extend dynamic chart behavior
// Resize the control flow graph when the window is resized.
window.onresize = function () { family_tree.resize(); };
// Select example **data set**
document.getElementById('dataset').addEventListener('change', function () {
    var element = this;
    world = element.value;
    setData();
    family_tree.redraw();
});
// Select spoilers from season
document.getElementById('season').addEventListener('change', function () {
    var element = this;
    season = +element.value;
    setData();
    family_tree.redraw();
});
// Set **Depth of Field**
document.getElementById('depth_of_field').addEventListener('change', function () {
    var element = this;
    family_tree.depth_of_field = +element.value;
    family_tree.redraw();
});
// View Full Tree Button Handler
document.getElementById('view_full_tree').addEventListener('click', function () {
    family_tree.focal = null;
    family_tree.redraw();
    return false;
});
