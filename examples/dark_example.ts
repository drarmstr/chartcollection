// # C3 Butterfly Dark Family Tree
// _Demonstrates a Butterfly Caller/Callee flow chart for a family tree based on time travel for the Netflix series "Dark"_.

// ## Family Datasets

// People relations contain a `parent` and a `child`
interface Relation {
    parent: string;
    child: string;
    type?: 'adopted';
}

// Example data sets
var family_datasets = {
    jonas: {
        relations: [
            {parent: 'Elisabeth Doppler', child: 'Charlotte Doppler'},
            {parent: 'Noah', child: 'Charlotte Doppler'},
            {parent: 'Charlotte Doppler', child: 'Elisabeth Doppler'},
            {parent: 'Peter Doppler', child: 'Elisabeth Doppler'},
            {parent: 'Charlotte Doppler', child: 'Franziska Doppler'},
            {parent: 'Peter Doppler', child: 'Franziska Doppler'},
            {parent: 'Helge Doppler', child: 'Peter Doppler'},
            {parent: 'Ulla Schmidt', child: 'Peter Doppler'},
            {parent: 'Greta Doppler', child: 'Helge Doppler'},
            {parent: 'Bernd Doppler', child: 'Helge Doppler'},
            {parent: 'Katharina Nielsen', child: 'Magnus Nielsen'},
            {parent: 'Ulrich Nielsen', child: 'Magnus Nielsen'},
            {parent: 'Katharina Nielsen', child: 'Martha Nielsen'},
            {parent: 'Ulrich Nielsen', child: 'Martha Nielsen'},
            {
              parent: 'Katharina Nielsen',
              child: 'Mikkel Nielsen / Michael Kahnwald',
            },
            {
              parent: 'Ulrich Nielsen',
              child: 'Mikkel Nielsen / Michael Kahnwald',
            },
            {
              parent: 'Mikkel Nielsen / Michael Kahnwald',
              child: 'Jonas Kahnwald',
            },
            {parent: 'Hannah Kahnwald', child: 'Jonas Kahnwald'},
            {
              parent: 'Ines Kahnwald',
              child: 'Mikkel Nielsen / Michael Kahnwald',
              type: 'adopted'
            },
            {parent: 'Daniel Kahnwald', child: 'Ines Kahnwald'},
            {parent: 'Helene Albers', child: 'Katharina Nielsen'},
            {parent: 'Hermann Albers', child: 'Katharina Nielsen'},
            {parent: 'Sebastian Kruger', child: 'Hannah Kahnwald'},
            {parent: 'Hannah Kahnwald', child: 'Silja Tiedemann'},
            {parent: 'Egon Tiedemann', child: 'Silja Tiedemann'},
            {parent: 'Egon Tiedemann', child: 'Claudia Tiedemann'},
            {parent: 'Doris Tiedemann', child: 'Claudia Tiedemann'},
            {parent: 'Claudia Tiedemann', child: 'Regina Tiedemann'},
            {parent: 'Bernd Doppler', child: 'Regina Tiedemann'},
            {parent: 'Aleksander Tiedemann', child: 'Bartosz Tiedemann'},
            {parent: 'Regina Tiedemann', child: 'Bartosz Tiedemann'},
            {parent: 'Bartosz Tiedemann', child: 'Noah'},
            {parent: 'Silja Tiedemann', child: 'Noah'},
            {parent: 'Bartosz Tiedemann', child: 'Agnes Nielsen'},
            {parent: 'Silja Tiedemann', child: 'Agnes Nielsen'},
            {parent: 'Jana Nielsen', child: 'Ulrich Nielsen'},
            {parent: 'Jana Nielsen', child: 'Mads Nielsen'},
            {parent: 'Tronte Nielsen', child: 'Ulrich Nielsen'},
            {parent: 'Tronte Nielsen', child: 'Mads Nielsen'},
            {parent: 'Agnes Nielsen', child: 'Tronte Nielsen'},
            {parent: 'The Unknown', child: 'Tronte Nielsen'},
            {parent: 'Jonas Kahnwald', child: 'The Unknown'},
            {parent: 'Martha Nielsen', child: 'The Unknown'},
            {parent: 'Leopold Tannhaus', child: 'H.G. Tannhaus'},
            {parent: 'Gustav Tannhaus', child: 'Leopold Tannhaus'},
            {parent: 'Heinrich Tannhaus', child: 'Gustav Tannhaus'},
            {parent: 'H.G. Tannhaus', child: 'Charlotte Doppler', type: 'adopted'},
            {parent: 'H.G. Tannhaus', child: 'Marek Tannhaus'},
            {parent: 'Marek Tannhaus', child: 'Charlotte Tannhaus'},
            {parent: 'Sonja Tannhaus', child: 'Charlotte Tannhaus'},
          ],
        names: [],
    },
    martha: {
        relations: [
            {parent: 'Elisabeth Doppler', child: 'Charlotte Doppler'},
            {parent: 'Noah', child: 'Charlotte Doppler'},
            {parent: 'Charlotte Doppler', child: 'Elisabeth Doppler'},
            {parent: 'Peter Doppler', child: 'Elisabeth Doppler'},
            {parent: 'Charlotte Doppler', child: 'Franziska Doppler'},
            {parent: 'Peter Doppler', child: 'Franziska Doppler'},
            {parent: 'Helge Doppler', child: 'Peter Doppler'},
            {parent: 'Ulla Schmidt', child: 'Peter Doppler'},
            {parent: 'Greta Doppler', child: 'Helge Doppler'},
            {parent: 'Bernd Doppler', child: 'Helge Doppler'},
            {parent: 'Katharina Nielsen', child: 'Magnus Nielsen'},
            {parent: 'Ulrich Nielsen', child: 'Magnus Nielsen'},
            {parent: 'Katharina Nielsen', child: 'Martha Nielsen'},
            {parent: 'Ulrich Nielsen', child: 'Martha Nielsen'},
            {
              parent: 'Katharina Nielsen',
              child: 'Mikkel Nielsen / Michael Kahnwald',
            },
            {
              parent: 'Ulrich Nielsen',
              child: 'Mikkel Nielsen / Michael Kahnwald',
            },
            {parent: 'Daniel Kahnwald', child: 'Ines Kahnwald'},
            {parent: 'Helene Albers', child: 'Katharina Nielsen'},
            {parent: 'Hermann Albers', child: 'Katharina Nielsen'},
            {parent: 'Sebastian Kruger', child: 'Hannah Kahnwald'},
            {parent: 'Hannah Kahnwald', child: 'Silja Tiedemann'},
            {parent: 'Egon Tiedemann', child: 'Silja Tiedemann'},
            {parent: 'Egon Tiedemann', child: 'Claudia Tiedemann'},
            {parent: 'Doris Tiedemann', child: 'Claudia Tiedemann'},
            {parent: 'Claudia Tiedemann', child: 'Regina Tiedemann'},
            {parent: 'Bernd Doppler', child: 'Regina Tiedemann'},
            {parent: 'Aleksander Tiedemann', child: 'Bartosz Tiedemann'},
            {parent: 'Regina Tiedemann', child: 'Bartosz Tiedemann'},
            {parent: 'Bartosz Tiedemann', child: 'Noah'},
            {parent: 'Silja Tiedemann', child: 'Noah'},
            {parent: 'Bartosz Tiedemann', child: 'Agnes Nielsen'},
            {parent: 'Silja Tiedemann', child: 'Agnes Nielsen'},
            {parent: 'Jana Nielsen', child: 'Ulrich Nielsen'},
            {parent: 'Jana Nielsen', child: 'Mads Nielsen'},
            {parent: 'Tronte Nielsen', child: 'Ulrich Nielsen'},
            {parent: 'Tronte Nielsen', child: 'Mads Nielsen'},
            {parent: 'Agnes Nielsen', child: 'Tronte Nielsen'},
            {parent: 'The Unknown', child: 'Tronte Nielsen'},
            {parent: 'Martha Nielsen', child: 'The Unknown'},
            {parent: 'Leopold Tannhaus', child: 'H.G. Tannhaus'},
            {parent: 'Gustav Tannhaus', child: 'Leopold Tannhaus'},
            {parent: 'Heinrich Tannhaus', child: 'Gustav Tannhaus'},
            {parent: 'H.G. Tannhaus', child: 'Charlotte Doppler', type: 'adopted'},
            {parent: 'H.G. Tannhaus', child: 'Marek Tannhaus'},
            {parent: 'Marek Tannhaus', child: 'Charlotte Tannhaus'},
            {parent: 'Sonja Tannhaus', child: 'Charlotte Tannhaus'},
        ],
    },
    origin: {
        relations: [
            {parent: 'Helge Doppler', child: 'Peter Doppler'},
            {parent: 'Ulla Schmidt', child: 'Peter Doppler'},
            {parent: 'Greta Doppler', child: 'Helge Doppler'},
            {parent: 'Bernd Doppler', child: 'Helge Doppler'},
            {parent: 'Daniel Kahnwald', child: 'Ines Kahnwald'},
            {parent: 'Helene Albers', child: 'Katharina Nielsen'},
            {parent: 'Hermann Albers', child: 'Katharina Nielsen'},
            {parent: 'Sebastian Kruger', child: 'Hannah Kahnwald'},
            {parent: 'Egon Tiedemann', child: 'Claudia Tiedemann'},
            {parent: 'Doris Tiedemann', child: 'Claudia Tiedemann'},
            {parent: 'Claudia Tiedemann', child: 'Regina Tiedemann'},
            {parent: 'Bernd Doppler', child: 'Regina Tiedemann'},
            {parent: 'H.G. Tannhaus', child: 'Marek Tannhaus'},
            {parent: 'Leopold Tannhaus', child: 'H.G. Tannhaus'},
            {parent: 'Gustav Tannhaus', child: 'Leopold Tannhaus'},
            {parent: 'Heinrich Tannhaus', child: 'Gustav Tannhaus'},
            {parent: 'Marek Tannhaus', child: 'Charlotte Tannhaus'},
            {parent: 'Sonja Tannhaus', child: 'Charlotte Tannhaus'},
          ],
    },
};
['jonas', 'martha', 'origin'].forEach((world) => {
    const names = new Set();
    for (const relation of family_datasets[world].relations) {
        names.add(relation.parent);
        names.add(relation.child);
    }
    family_datasets[world].names = Array.from(names);
});

// A Scale to generate colors for each name.
var family_name_color = d3.scale.category10();
var name_color = (fullName) => {
    var names = fullName.split(' ');
    return family_name_color(names[names.length - 1]);
};


// # Create Butterfly visualization

// Create `Butterfly` visualization object
var family_tree = new c3.Sankey.Butterfly({
    // Bind to the DOM and set height.
    anchor: '#dark_tree',
    height: 800,

    // Link to family tree **data**
    data: family_datasets['jonas'].names,
    links: family_datasets['jonas'].relations,

    // Define unique **key** accessors
    key: (name) => name,
    link_key: (relation) => relation.parent + '/' + relation.child,
    link_value: () => 1,
    link_source: (relation) => relation.parent,
    link_target: (relation) => relation.child,

    // **Align** tree to start on the `left`
    align: 'left',

    // **Overflow** to the right if the nodes would become too crowded.
    overflow_width_ratio: 0.5,

    node_padding: '75%',

    // **Style** nodes based on the name and create tooltips.
    // **Animate** transitions for all of the nodes and links.
    node_options: {
        title: (name) => name,
        animate: true,
        duration: 3000,
    },
    rect_options: {
        styles: {
            fill: name => name_color(name),
        },
        animate: true,
        duration: 3000,
    },
    link_options: {
        title: (link) => link.parent + " → " + link.child,
        styles: {
            stroke: link => d3.interpolateRgb(
                name_color(link.parent),
                name_color(link.child),
            )(0.5),
        },
        animate: true,
        duration: 3000,
    },
    path_options: {
        styles: {
            'stroke-dasharray': link => link.type === 'adopted' ? 4 : null,
        },
        animate: true,
        duration: 3000,
    },

    // Add text **labels** for each node
    node_label_options: {
        text: (name) => name,
        orientation: 'horizontal',
        animate: true,
        duration: 3000,
    },
});
family_tree.render();
console.debug('RENDERED', family_tree);


// ## Extend dynamic chart behavior

// Resize the control flow graph when the window is resized.
window.onresize = function () { family_tree.resize(); };


// Select example **data set**
document.getElementById('dataset').addEventListener('change', function () {
    let element = <HTMLInputElement>this;
    family_tree.data = family_datasets[element.value].names;
    family_tree.links = family_datasets[element.value].relations;
    family_tree.redraw();
});

// Set **Depth of Field**
document.getElementById('depth_of_field').addEventListener('change', function () {
    let element = <HTMLInputElement>this;
    family_tree.depth_of_field = +element.value;
    family_tree.redraw();
});

// View Full Tree Button Handler
document.getElementById('view_full_tree').addEventListener('click', function () {
    family_tree.focal = null;
    family_tree.redraw();
    return false;
});
