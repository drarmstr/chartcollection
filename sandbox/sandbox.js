$(function () {
    window.chart = new c3.Plot.Zoomable({
        anchor: $('#chart')[0],
        width: 600,
        height: 300,
        zoomable: 'h',
        //data: [
        //    { x: 1, y1: 2, y2: 3 },
        //    { x: 2, y1: 1, y2: 4 },
        //    { x: 3, y1: 2, y2: 3 },
        //    { x: 4, y1: 3, y2: 2 },
        //    { x: 5, y1: 1, y2: 2 },
        //    { x: 6, y1: 2, y2: 3 },
        //],
        data: [
            { x: 1, y1: 2, y2: 3 },
            { x: 1.5, y1: undefined, y2: undefined },
            { x: 3, y1: 2, y2: 3 },
            { x: 2, y1: 1, y2: 4 },
            { x: 4, y1: 3, y2: undefined },
            { x: 5, y1: 2, y2: 2 },
            { x: 6, y1: 2, y2: 3 },
        ],
        h: d3.scale.linear().domain([0, 6]),
        v: d3.scale.linear().domain([0, 8]),
        x: function (d) { return d.x; },
        layers: [
            new c3.Plot.Layer.Area({
                stacks: [{
                        y: function (d) { return d.y1; },
                        options: { styles: { fill: 'pink' } },
                    }, {
                        y: function (d) { return d.y2; },
                        options: { styles: { fill: 'orange' } },
                    }],
            }),
            new c3.Plot.Layer.Line({
                y: function (d) { return d.y1; },
                defined: function (d) { return d.y1 !== 3; },
                options: { styles: { stroke: 'darkred' } },
            }),
            new c3.Plot.Layer.Line({
                y: function (d) { return d.y2; },
                r: 5,
                options: { styles: { stroke: 'blue' } },
            }),
        ],
    });
    window.chart.render();
    //window.legend = new c3.Legend.PlotLegend({
    //    anchor: $('<aside></aside>').appendTo($('body'))[0],
    //    plot: window.chart,
    //});
    //window.legend.render();
});
//# sourceMappingURL=sandbox.js.map