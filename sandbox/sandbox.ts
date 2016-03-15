interface Window {
    chart: c3.Plot<any>;
    legend: c3.Legend.PlotLegend;
}



//interface PlotOptions<D> {
//    data?: D[];
//    acc?: (d: D) => void;
//    layers?: Layer<D, any>[];
//}
//class Plot<D> implements PlotOptions<D> {
//    data: D[];
//    acc: (d: D) => void;
//    layers: Layer<D, any>[];
//    constructor(opt: PlotOptions<D>) { }
//}
//interface LayerOptions<D, L> {
//    data?: L[];
//    acc?: (d: D & L) => void;
//}
//class Layer<D, L> implements LayerOptions<D, L> {
//    data: L[];
//    acc: (d: D & L) => void;
//    constructor(opt: LayerOptions<D, L>) { }
//}
//new Plot({
//    data: [{ foo: 1 }],
//    acc: (v) => v.foo,
//    layers: [
//        new Layer({
//        //new Layer<{foo:number}, { bar: number }>({
//            data: [{ bar: 3 }],
//            acc: (v) => v.bar
//            //acc: (v) => (<{ foo: number }>v).foo,
//        }),
//    ],
//});


//interface Opt<E,L> {
//    item: L;
//    func: (v:E&L) => void;
//}
//class Entry<E,L> {
//    constructor(opt: Opt<E,L>) { }
//}
//interface Widget<W> {
//    item: W
//    list: Entry<W,any>[];
//}
//function process<T>(widget: Widget<T>) { }
//process({
//    item: { foo: 1 },
//    list: [
//        new Entry({ item: { bar: 1 }, func: (v) => v.foo }),
//        new Entry({ item: { bar: 1 }, func: (v) => v.bar })
//    ]
//});




//class Entry<T> {
//    constructor(callback: (v: T) => number) { }
//}
//interface Widget {
//    list: Entry<{ foo: number }>[];
//}

//var widget: Widget = {
//    list: [
//        new Entry((v) => v.foo), // Error accessig v.foo
//    ]
//};
//var widget2: Widget = {
//    list: [
//        new Entry<{ foo: number }>((v) => v.foo), // Error accessig v.foo
//    ]
//};




interface SandboxDatum {
    x: number;
    y1: number;
    y2: number;
}

$(() => {
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

        x: (d) => d.x,

        layers: [
            new c3.Plot.Layer.Area<SandboxDatum>({
                stacks: [{
                    y: (d) => d.y1,
                    options: { styles: { fill: 'pink' } },
                }, {
                    y: (d) => d.y2,
                    options: { styles: { fill: 'orange' } },
                }],
            }),
            new c3.Plot.Layer.Line<SandboxDatum>({
                y: (d) => d.y1,
                defined: (d) => d.y1 !== 3,
                options: { styles: { stroke: 'darkred' } },
            }),
            new c3.Plot.Layer.Line<SandboxDatum>({
                y: (d) => d.y2,
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