declare module c3 {

    export class c3 {
        static verison: number | string;
        static select(parent: c3.Selection<any>, query?: string, before?: string, children_only?: boolean): c3.Selection<any>;
    }


    //////////////////////////////////////////////////////////////////////////////////////
    // D3
    //////////////////////////////////////////////////////////////////////////////////////
    // Make a base class for any D3 scale type
    type d3_Scale =
        d3.scale.Identity |
        d3.scale.Linear<any, any> |
        d3.scale.Pow<any, any> |
        d3.scale.Log<any, any> |
        d3.scale.Quantize<any> |
        d3.scale.Quantile<any> |
        d3.scale.Threshold<any, any> |
        d3.scale.Ordinal<any, any> |
        d3.time.Scale<any, any>;


    //////////////////////////////////////////////////////////////////////////////////////
    // Utility
    //////////////////////////////////////////////////////////////////////////////////////
    module util {
        function extend<S,D>(dest: D, src: S): S & D;
        function defaults<S,D>(dest: D, src: S): S & D;
        function spin(ms: number): void;
        //function clone(obj: Object): Object;
        //function replicate(obj: Object): Object;
    }

    module array {
        function remove_item<T>(arr: T[], item: T): void;
        function sort_up<T>(arr: T[], accessor?: { (d: T): number }): T[];
        function sort_down<T>(arr: T[], accessor?: { (d: T): number }): T[];
        //function last<T>(arr: T[]): T;
        //function front<T>(arr: T[]): T;
        //function back<T>(arr: T[]): T[];
        //function merge(first: Array<any>, second: Array<any>): Array<any>;
        //function unique(arr: Array<any>): Array<any>;
    }

    module http {
        function deparam(string: string, key?: string): string;
        function deparam_query(key?: string): string;
    }

    module html {
        function escape(string: string): string;
    }


    //////////////////////////////////////////////////////////////////////////////////////
    // c3 Selection
    //////////////////////////////////////////////////////////////////////////////////////
    class Selection<D> {
        constructor(parent?: d3.Selection<any>, query?: string, before?: string, children_only?: boolean);

        all: d3.Selection<D>;
        new: d3.Selection<D>;
        old: d3.Selection<D>;
        opt: c3.Selection.Options<D>;
        opt_array: c3.Selection.Options<D>[];

        select(query: string, before?: string, children_only?: boolean): Selection<any>;
        inherit(query: string, create?: boolean, prepend?: boolean): this;
        singleton(datum?: D): this;
        bind(data: D[], key?: { (d: D): number | string }): this;
        options(opt: c3.Selection.Options<D>, opt_accessor?: { (d: D, i: number, j?: number): c3.Selection.Options<D> }): this;
        update(): this;
        position(attrs: { [key: string]: string | number | { (d: D, i: number, j?: number): string | number } }): this;
        style(style_new?: boolean): this;
        node(): HTMLElement;
    }

    module Selection {
        interface Options<D> {
            class?: string | { (d: D, i: number, j?: number): string };
            classes?: { [key: string]: boolean | { (d: D, i: number, j?: number): boolean } };
            styles?: { [key: string]: string | number | d3.Color | { (d: D, i: number, j?: number): string | number | d3.Color } };
            events?: { [key: string]: (d: D, i: number, j?: number) => any };
            text?: string | number | { (d: D, i: number, j?: number): string | number };
            html?: string | number | { (d: D, i: number, j?: number): string };
            title?: string | number | { (d: D, i: number, j?: number): string | number };
            animate?: boolean;
            duration?: number;
            animate_old?: boolean;
        }
    }



    //////////////////////////////////////////////////////////////////////////////////////
    // Dispatch
    //////////////////////////////////////////////////////////////////////////////////////
    class Dispatch {
        on(event: string, handler: (...args: any[]) => void): void;
        trigger(event: string, ...args): void;
    }


    //////////////////////////////////////////////////////////////////////////////////////
    // Base
    //////////////////////////////////////////////////////////////////////////////////////
    interface BaseOptions {
        anchor?: string | HTMLElement;
        height?: number | string;
        width?: number | string;
        anchor_styles?: { [key: string]: string | number };
        handlers?: { [key: string]: Function };
    }
    interface Base extends BaseOptions { }
    class Base extends Dispatch implements BaseOptions {
        type: string;
        rendered: boolean;

        constructor(opt?: BaseOptions);
        render(opt?: BaseOptions): this;
        resize(width?: number | string, height?: number | string): this;
        redraw(origin?: string): this;
        restyle(): this;
    }


    //////////////////////////////////////////////////////////////////////////////////////
    // Table
    //////////////////////////////////////////////////////////////////////////////////////
    interface TableOptions<D> extends BaseOptions {
        data?: D[];
        key?: (d: D, i: number, j: number) => number|string;
        filter?: (d: D, i: number, j: number) => boolean;
        columns?: c3.Table.Column<D>[];
        selectable?: boolean | string;
        sortable?: boolean;
        sort_column?: c3.Table.Column<D> | string;
        limit_rows?: number;
        pagination?: boolean;
        page?: number;
        max_pages_in_paginator?: number;
        searchable?: boolean | { (d: D, i: number): string };
        searchable_if_not_paginated?: boolean;
        table_options?: c3.Selection.Options<void>;
        table_header_options?: c3.Selection.Options<void>;
        header_options?: c3.Selection.Options<Table.Column<D>>;
        footer_options?: c3.Selection.Options<void>;
        table_body_options?: c3.Selection.Options<D>;
        row_options?: c3.Selection.Options<D>;
        cell_options?: c3.Selection.Options<D>;
        vis_options?: c3.Selection.Options<D>;
    }
    interface Table<D> extends TableOptions<D> { }
    class Table<D> extends Base implements TableOptions<D> {
        table: c3.Selection<void>;
        header: c3.Selection<void>;
        headers: c3.Selection<c3.Table.Column<D>>;
        body: c3.Selection<void>;
        rows: c3.Selection<D>;
        cells: c3.Selection<D>;
        selections: D[];

        constructor(opt?: TableOptions<D>);
        render(opt?: TableOptions<D>): this;
        static set_select<D>(set: D[], item: D, selectable?: boolean | string): D[];
        sort(column: c3.Table.Column<D>, ascending: boolean): void;
        highlight(selections?: D[]): void;
        select(selections?: D[]): void;
        search(value: string): [D, number];
        find(value: string): [D, number];

        on(event: string, handler: (...args: any[]) => void): void;
        on(event: 'select', handler: (selection: D[]) => void): void;
        on(event: 'found', handler: (search: string, datum: D, i: number) => void): void;
    }
    module Table {
        interface Column<D> {
            header?: c3.Selection.Options<D>;
            cells?: c3.Selection.Options<D>;
            sortable?: boolean;
            value?: { (d: D): number };
            sort?: { (d: D): number };
            sort_ascending?: boolean;
            vis?: string;
            total_value?: number | { (): number };
            vis_options?: c3.Selection.Options<D>;
        }
    }


    //////////////////////////////////////////////////////////////////////////////////////
    // Legend
    //////////////////////////////////////////////////////////////////////////////////////
    interface LegendOptions<D,DD> extends BaseOptions {
        data?: D[];
        key?: (d: D, i: number) => number|string;
        filter?: (d: D, i: number) => boolean;
        nest?: boolean | { (d:D): DD[] };
        nest_key?: (d: DD, i: number, j: number) => number|string;
        hoverable?: boolean;
        list_options?: c3.Selection.Options<void>;
        item_options?: c3.Selection.Options<D>;
        nested_item_options?: c3.Selection.Options<DD>;
        bullet_options?: c3.Selection.Options<D> | boolean;
        nested_bullet_options?: c3.Selection.Options<DD> | boolean;
    }
    interface Legend<D, DD> extends LegendOptions<D, DD> { }
    class Legend<D,DD> extends Base implements LegendOptions<D,DD> {
        constructor(opt?: LegendOptions<D, DD>);
        render(opt?: LegendOptions<D, DD>): this;
    }
    module Legend {

        interface PlotLegendOptions extends LegendOptions<c3.Plot.Layer<any>, c3.Plot.Layer.Stackable.Stack<any>> {
            plot?: c3.Plot<any>;
            invert_layers?: boolean;
            html_names?: boolean;
            hover_fade?: number;
            duration?: number;
        }
        interface PlotLegend extends PlotLegendOptions { }
        class PlotLegend extends Legend<c3.Plot.Layer<any>, c3.Plot.Layer.Stackable.Stack<any>> implements PlotLegendOptions {
            constructor(opt?: PlotLegendOptions);
            render(opt?: PlotLegendOptions): this;

            on(event: string, handler: (...args: any[]) => void): void;
            on(event: 'layer_mouseenter', handler: (layer:c3.Plot.Layer<any>, i: number) => void): void;
            on(event: 'layer_mouseleave', handler: (layer: c3.Plot.Layer<any>, i: number) => void): void;
        }
    }


    //////////////////////////////////////////////////////////////////////////////////////
    // Chart
    //////////////////////////////////////////////////////////////////////////////////////
    interface ChartOptions extends BaseOptions {
        class?: string;
        options?: c3.Selection.Options<void>;
        content_options?: c3.Selection.Options<void>;
    }
    interface Chart extends ChartOptions { }
    class Chart extends Base implements ChartOptions {
        svg: c3.Selection<void>;
        content: c3.Selection<void>;

        constructor(opt?: ChartOptions);
        render(opt?: ChartOptions): this;
    }


    //////////////////////////////////////////////////////////////////////////////////////
    // Axis
    //////////////////////////////////////////////////////////////////////////////////////
    interface AxisOptions extends ChartOptions {
        scale?: d3_Scale | boolean;
        orient?: string;
        grid?: boolean;
        label?: string;
        ticks?: boolean;
        tick_label?: boolean | { (value): string };
        tick_values?: any[];
        tick_count?: number;
        tick_size?: number;
        path_size?: number;
        axis_size?: number;
    }
    interface Axis extends AxisOptions { }
    class Axis extends Chart implements AxisOptions {
        constructor(opt?: AxisOptions);
        render(opt?: AxisOptions): this;
    }
    module Axis {
        class X extends Axis { }
        class Y extends Axis { }
    }


    //////////////////////////////////////////////////////////////////////////////////////
    // Plot
    //////////////////////////////////////////////////////////////////////////////////////
    export interface PlotOptions<D> extends ChartOptions {
        layers?: c3.Plot.Layer<D & any>[];
        axes?: c3.Axis[];
        data?: D[];
        h?: d3_Scale;
        v?: d3_Scale;
        x?: (d: D, i: number, stack?: number) => any;
        y?: (d: D, i: number, stack?: number) => any;
        margins?: number | { top?: number; bottom?: number; left?: number; right?: number };
        crop_margins?: boolean | string;
        layer_options?: c3.Selection.Options<c3.Plot.Layer<D & any>>;
    }
    interface Plot<D> extends PlotOptions<D> { }
    class Plot<D> extends Chart implements PlotOptions<D> {
        content: Plot.PlotContent;

        constructor(opt?: PlotOptions<D>);
        render(opt?: PlotOptions<D>): this;
        min_x(): any;
        max_x(): any;
        min_y(): any;
        max_x(): any;
    }

    module Plot {
        interface PlotContent extends c3.Selection<void> {
            height?: number;
            width?: number;
        }

        interface SelectableOptions<D> extends PlotOptions<D> {
            selectable?: boolean | string;
            drag_selections?: boolean;
        }
        interface Selectable<D> extends SelectableOptions<D> { }
        class Selectable<D> extends Plot<D> implements SelectableOptions<D> {
            constructor(opt?: SelectableOptions<D>);
            render(opt?: SelectableOptions<D>): this;
            select(domain: number[] | number[][]): void;

            on(event: string, handler: (...args: any[]) => void): void;
            on(event: 'select', handler: (selection: number[] | number[][]) => void): void;
            on(event: 'selectend', handler: (selection: number[] | number[][]) => void): void;
        }

        interface ZoomableOptions<D> extends PlotOptions<D> {
            zoomable: string;
            snap_to_all?: number;
            select_x_value?: boolean;
            zoom_extent?: number | string;
        }
        interface Zoomable<D> extends ZoomableOptions<D> { }
        class Zoomable<D> extends Plot<D> implements ZoomableOptions<D> {
            constructor(opt?: ZoomableOptions<D>);
            render(opt?: ZoomableOptions<D>): this;
            focus(extent: number[] | number[][]): void;

            on(event: string, handler: (...args: any[]) => void): void;
            on(event: 'zoom', handler: (selection: number[] | number[][]) => void): void;
            on(event: 'zoomend', handler: (selection: number[] | number[][]) => void): void;
        }


        //////////////////////////////////////////////////////////////////////////////////////
        // Plot Layers
        //////////////////////////////////////////////////////////////////////////////////////
        interface LayerOptions<D> {
            name?: string | boolean;
            data?: D[];
            class?: string;
            static_data?: boolean;
            h?: d3_Scale;
            v?: d3_Scale;
            x?: number | { (d: D, i: number, j: number): number };
            y?: number | { (d: D, i: number, j: number): number };
            h_orient?: string;
            v_orient?: string;
            options?: c3.Selection.Options<c3.Plot.Layer<D>>;
            handlers?: { [key: string]: Function };
        }
        interface Layer<D> extends LayerOptions<D> { }
        class Layer<D> implements LayerOptions<D> {
            type: string;
            rendered: boolean;
            chart: c3.Chart;
            g: d3.Selection<void>;
            width: number;
            height: number;

            constructor(opt?: LayerOptions<D>);
            redraw(origin?: string): void;
            restyle(style_new: boolean): void;
            zoom(): void;
            min_x(): D;
            max_x(): D;
            min_y(): D;
            max_x(): D;
        }


        module Layer {

            //////////////////////////////////////////////////////////////////////////////////////
            // Stackable Layers
            //////////////////////////////////////////////////////////////////////////////////////
            interface StackableOptions<D> extends LayerOptions<D> {
                stack_options?: Stackable.stack_options<D>;
                stacks?: Stackable.StackOptions<D>[];
                safe?: boolean;
            }
            interface Stackable<D> extends StackableOptions<D> { }
            class Stackable<D> extends Layer<D> implements StackableOptions<D> {
                groups: c3.Selection<c3.Plot.Layer.Stackable.Stack<D>>;

                constructor(opt?: StackableOptions<D>);
            }
            module Stackable {
                interface stack_options<D> extends c3.Selection.Options<c3.Plot.Layer.Stackable.Stack<D>> {
                    key?: (d: D, i: number, stack?: number) => number | string;
                    name?: (key: number) => string | number;
                    offset?: string | Function;
                    order?: string;
                }

                interface StackOptions<D> {
                    key?: string;
                    name?: string | number;
                    y?: (d: D, i: number, stack: number) => any;
                    data?: D[];
                    options?: c3.Selection.Options<c3.Plot.Layer.Stackable.Stack<D>>
                }
                interface Stack<D> extends StackOptions<D> { }
                class Stack<D> implements StackOptions<D> {
                    constructor(opt: StackOptions<D>);
                }
            }


            //////////////////////////////////////////////////////////////////////////////////////
            // Line / Area Layers
            //////////////////////////////////////////////////////////////////////////////////////
            interface PathOptions<D> extends StackableOptions<D> {
                path_generator_factory?: () => { (): string };
                interpolate?: string;
                tension?: number;
                defined?: (d: D, i: number, stack?: number) => boolean;
                r?: number | { (d: D, i: number, stack?: number): number };
                a?: number | { (d: D, i: number, stack?: number): number };
                path_options?: c3.Selection.Options<Stackable.Stack<D>>;
                circle_options?: c3.Selection.Options<D>;
                label_options?: c3.Selection.Options<D>;
            }
            interface Path<D> extends PathOptions<D> { }
            class Path<D> extends Stackable<D> implements PathOptions<D> {
                paths: c3.Selection<c3.Plot.Layer.Stackable.Stack<D>>;
                circles: c3.Selection<D>;
                labels: c3.Selection<D>;

                constructor(opt?: PathOptions<D>);
            }

            interface AreaOptions<D> extends PathOptions<D> {
                baseline?: number | { (d: D, i: number, stack?: number): number };
            }
            interface Area<D> extends AreaOptions<D> { }
            class Area<D> extends Path<D> implements AreaOptions<D>{
                constructor(opt?: AreaOptions<D>);
            }

            class Line<D> extends Path<D> { }

            module Line {

                //////////////////////////////////////////////////////////////////////////////////////
                // Straight Line Layers
                //////////////////////////////////////////////////////////////////////////////////////
                interface StraightOptions<D> extends LayerOptions<D> {
                    key?: (d: D, i: number) => number | string;
                    value?: (d: D, i: number) => any;
                    filter?: (d: D, i: number) => boolean;
                    draggable?: boolean;
                    vector_options?: c3.Selection.Options<D>;
                    line_options?: c3.Selection.Options<D>;
                    grab_line_options?: c3.Selection.Options<D>;
                    label_options?: Straight.label_options<D>;
                }
                interface Straight<D> extends StraightOptions<D> { }
                class Straight<D> extends Layer<D> implements StraightOptions<D> {
                    constructor(opt?: StraightOptions<D>);

                    vectors: c3.Selection<D>;
                    lines: c3.Selection<D>;
                    labels: c3.Selection<D>;

                    on(event: string, handler: (...args: any[]) => void): void;
                    on(event: 'dragstart', handler: (d: D, i: number) => void): void;
                    on(event: 'drag', handler: (value: any, d: D, i: number) => void): void;
                    on(event: 'dragend', handler: (value: any, d: D, i: number) => void): void;
                }
                module Straight {
                    interface label_options<T> extends c3.Selection.Options<T> {
                        alignment?: string;
                        dx?: number | string;
                        dy?: number | string;
                    }
                }

                class Horizontal<D> extends Straight<D> { }
                class Vertical<D> extends Straight<D> { }
            }


            //////////////////////////////////////////////////////////////////////////////////////
            // Bar Layer
            //////////////////////////////////////////////////////////////////////////////////////
            interface BarOptions<D> extends StackableOptions<D> {
                key?: (d: D, i: number, stack?: number) => number | string;
                bar_width?: string | number | { (d: D, i: number, stack?: number): string | number };
                rect_options?: c3.Selection.Options<D>;
            }
            interface Bar<D> extends BarOptions<D> { }
            class Bar<D> extends Stackable<D> implements BarOptions<D> {
                constructor(opt?: BarOptions<D>);
                rects: c3.Selection<D>;
            }


            //////////////////////////////////////////////////////////////////////////////////////
            // Region Layer
            //////////////////////////////////////////////////////////////////////////////////////
            class Region<D> extends Layer<D> {
                // TODO
            }


            //////////////////////////////////////////////////////////////////////////////////////
            // Scatter Plot Layer
            //////////////////////////////////////////////////////////////////////////////////////
            interface ScatterOptions<D> extends LayerOptions<D> {
                key?: (d: D, i: number) => number | string;
                value?: number | { (d: D, i: number): number };
                r?: number | { (d: D, i: number): number };
                a?: number | { (d: D, i: number): number };
                safe?: boolean;
                filter?: (d: D, i: number) => boolean;
                limit_elements?: number;
                point_options?: c3.Selection.Options<D>;
                circle_options?: c3.Selection.Options<D>;
                label_options?: c3.Selection.Options<D>;
            }
            interface Scatter<D> extends ScatterOptions<D> { }
            class Scatter<D> extends Layer<D> implements ScatterOptions<D> {
                points: c3.Selection<D>;
                circles: c3.Selection<D>;
                labels: c3.Selection<D>;

                constructor(opt?: ScatterOptions<D>);
            }


            //////////////////////////////////////////////////////////////////////////////////////
            // Swimlane Layers
            //////////////////////////////////////////////////////////////////////////////////////
            interface SwimlaneOptions<D> extends LayerOptions<D> {
                hover?: string | number | { (d: D, i: number, swimlane: number): string | number };
                lane_options?: c3.Selection.Options<number>;
                dy?: number;
            }
            interface Swimlane<D> extends SwimlaneOptions<D> { }
            class Swimlane<D> extends Layer<D> implements SwimlaneOptions<D> {
                lanes: c3.Selection<number>;

                constructor(opt?: SwimlaneOptions<D>);
            }
            module Swimlane {

                interface SegmentOptions<D> extends SwimlaneOptions<D> {
                    dx: number | { (d: D): number };
                    key?: (d: D) => number | string;
                    filter?: (d: D, i: number) => boolean;
                    value?: number | { (d: D): number };
                    limit_elements?: number;
                    rect_options?: c3.Selection.Options<D>;
                    label_options?: c3.Selection.Options<D>;
                }
                interface Segment<D> extends SegmentOptions<D> { }
                class Segment<D> extends Swimlane<D> implements SegmentOptions<D> {
                    rects: c3.Selection<D>;
                    labels: c3.Selection<D>;
                    labels_text: c3.Selection<D>;

                    constructor(opt?: SegmentOptions<D>);
                }

                interface FlamechartOptions<D> extends SegmentOptions<D> {
                }
                interface Flamechart<D> extends FlamechartOptions<D> { }
                class Flamechart<D> extends Segment<D> implements FlamechartOptions<D> {
                    constructor(opt?: FlamechartOptions<D>);
                }

                interface IcicleOptions<D> extends SwimlaneOptions<D> {
                    key?: (d: D) => number | string;
                    value?: (d: D) => number;
                    self_value?: (d: D) => number;
                    parent_key?: (d: D) => number | string;
                    children_keys?: (d: D) => (number | string)[];
                    children?: (d: D) => D[];
                    sort?: boolean | { (d: D): number };
                    limit_elements?: number;
                    limit_min_percent?: number;
                    rect_options?: c3.Selection.Options<D>;
                    label_options?: c3.Selection.Options<D>;
                }
                interface Icicle<D> extends IcicleOptions<D> { }
                class Icicle<D> extends Swimlane<D> implements IcicleOptions<D> {
                    rects: c3.Selection<D>;
                    labels: c3.Selection<D>;

                    constructor(opt?: IcicleOptions<D>);
                    rebase(d: D);
                    rebase_key(key: number);
                }

                interface SampledOptions<D> extends SwimlaneOptions<D> {
                    dx: number | { (d: D): number };
                    filter?: (d: D, i: number) => boolean;
                    safe?: boolean;
                }
                interface Sampled<D> extends SampledOptions<D> { }
                class Sampled<D> extends Swimlane<D> {
                    constructor(opt?: SampledOptions<D>);
                }

                module Sampled {
                    interface SVGOptions<D> extends SampledOptions<D> {
                        line_options?: c3.Selection.Options<D>;
                    }
                    interface SVG<D> extends SVGOptions<D> { }
                    class SVG<D> extends Sampled<D> {
                        lines: c3.Selection<D>;

                        constructor(opt?: SVGOptions<D>);
                    }

                    interface CanvasOptions<D> extends SampledOptions<D> {
                        line_options?: c3.Selection.Options<D>;
                    }
                    interface Canvas<D> extends CanvasOptions<D> { }
                    class Canvas<D> extends Sampled<D> {
                        constructor(opt?: CanvasOptions<D>);
                    }
                }
            }

            //////////////////////////////////////////////////////////////////////////////////////
            // Decimated Layers
            //////////////////////////////////////////////////////////////////////////////////////
            //interface DecimatedOptions<D> extends LayerOptions<D> {
            //    renderport_elements?: number;
            //    pixels_per_bucket_limit?: number;
            //}
            //interface Decimated<D> extends DecimatedOptions<D> { }
            //class Decimated<D> extends Layer<D> implements DecimatedOptions<D> {
            //    constructor(levels: D[][], proto_layer: Layer<D>);
            //}
        }
    }


    //////////////////////////////////////////////////////////////////////////////////////
    // Polar Plots
    //////////////////////////////////////////////////////////////////////////////////////
    export interface PolarOptions<D> extends ChartOptions {
        layers?: c3.Polar.Layer<D & any>[];
        axes?: c3.Axis[];
        data?: D[];
        r?: d3_Scale;
        t?: d3_Scale;
        angular_range?: number[];
        zoomable?: boolean;
        zoom_extent?: number[];
        layer_options?: c3.Selection.Options<c3.Polar.Layer<D & any>>;
    }
    interface Polar<D> extends PolarOptions<D> { }
    class Polar<D> extends Chart implements PolarOptions<D> {
        constructor(opt?: PolarOptions<D>);
        render(opt?: PolarOptions<D>): this;
        static toPolar(x: number, y: number): [number, number];
        toPolar(x: number, y: number): [number, number];
    }

    module Polar {

        //////////////////////////////////////////////////////////////////////////////////////
        // Polar Layers
        //////////////////////////////////////////////////////////////////////////////////////
        interface LayerOptions<D> {
            name?: string | boolean;
            data?: D[];
            class?: string;
            r?: d3_Scale;
            t?: d3_Scale;
            options?: c3.Selection.Options<c3.Polar.Layer<D>>;
            handlers?: { [key: string]: Function };
        }
        interface Layer<D> extends LayerOptions<D> { }
        class Layer<D> implements LayerOptions<D> {
            type: string;
            rendered: boolean;
            chart: c3.Chart;
            g: d3.Selection<void>;
            content: c3.Selection<void>;
            width: number;
            height: number;
            radius: number;

            constructor(opt?: LayerOptions<D>);
            redraw(origin?: string): void;
            restyle(style_new: boolean): void;
            toPolar(x: number, y: number): [number, number];
        }


        module Layer {
            //////////////////////////////////////////////////////////////////////////////////////
            // Radial Lines
            //////////////////////////////////////////////////////////////////////////////////////
            interface RadialOptions<D> extends LayerOptions<D> {
                key?: (d: D, i: number) => number | string;
                value?: (d: D, i: number) => number;
                filter?: (d: D, i: number) => boolean;
                inner_radius?: number | { (d: D, i: number): number };
                outer_radius?: number | { (d: D, i: number): number };
                draggable?: boolean;
                vector_options?: c3.Selection.Options<D>;
                line_options?: c3.Selection.Options<D>;
            }
            interface Radial<D> extends RadialOptions<D> { }
            class Radial<D> extends Layer<D> implements RadialOptions<D> {
                vectors: c3.Selection<D>;
                lines: c3.Selection<D>;

                constructor(opt?: RadialOptions<D>);
            }


            //////////////////////////////////////////////////////////////////////////////////////
            // Arc Segment Layers
            //////////////////////////////////////////////////////////////////////////////////////
            interface SegmentOptions<D> extends LayerOptions<D> {
                key: (d: D) => number | string;
                value?: (d: D) => number;
                filter?: (d: D, i: number) => boolean;
                limit_elements?: number;
                pad?: number | { (d: D, i: number): number };
                arc_options?: c3.Selection.Options<D>;
            }
            interface Segment<D> extends SegmentOptions<D> {}
            class Segment<D> extends Layer<D> implements SegmentOptions<D> {
                arcs: c3.Selection<D>;

                constructor(opt?: SegmentOptions<D>);
                get_position_from_key(key: number): Segment.Node;
            }
            module Segment {
                interface Node {
                    x1: number,
                    x2: number,
                    y1: number,
                    y2: number,
                    children: Node[],
                    value: number,
                }
            }

            interface ArcOptions<D> extends SegmentOptions<D> {
                inner_radius?: number | { (d: D): number };
                outer_radius?: number | { (d: D): number };
                start_angle?: number | { (d: D): number };
                end_angle?: number | { (d: D): number };
            }
            interface Arc<D> extends ArcOptions<D> { }
            class Arc<D> extends Segment<D> implements ArcOptions<D> {
                constructor(opt?: ArcOptions<D>);
            }

            //////////////////////////////////////////////////////////////////////////////////////
            // Pie Chart
            //////////////////////////////////////////////////////////////////////////////////////
            interface PieOptions<D> extends SegmentOptions<D> {
                inner_radius?: number | { (d: D): number };
                outer_radius?: number | { (d: D): number };
                sort?: boolean | number | { (d: D): number };
                other_options?: c3.Selection.Options<void>;
            }
            interface Pie<D> extends PieOptions<D> { }
            class Pie<D> extends Segment<D> implements PieOptions<D> {
                constructor(opt?: PieOptions<D>);
            }


            //////////////////////////////////////////////////////////////////////////////////////
            // Sunburst
            //////////////////////////////////////////////////////////////////////////////////////
            interface SunburstOptions<D> extends SegmentOptions<D> {
                self_value?: (d: D) => number;
                limit_min_percent?: number;
                sort?: boolean | number | { (d: D): number };
                parent_key?: (d: D) => number;
                children_keys?: (d: D) => number[];
                children?: (d: D) => D[];
                center_options?: c3.Selection.Options<void>;
                bullseye_options?: c3.Selection.Options<void>;
            }
            interface Sunburst<D> extends SunburstOptions<D> { }
            class Sunburst<D> extends Segment<D> implements SunburstOptions<D> {
                center: c3.Selection<void>;
                bullseye: c3.Selection<D>;

                constructor(opt?: SunburstOptions<D>);
                rebase(d: D);
                rebase_key(key: number);
                get_leaf(position: number): D;
            }
        }
    }


    //////////////////////////////////////////////////////////////////////////////////////
    // Graphs
    //////////////////////////////////////////////////////////////////////////////////////
    export interface GraphOptions<D,L> extends ChartOptions {
        data?: D[];
        links?: L[];
    }
    interface Graph<D,L> extends GraphOptions<D,L> { }
    class Graph<D,L> extends Chart implements GraphOptions<D,L> {
        constructor(opt?: GraphOptions<D,L>);
        render(opt?: GraphOptions<D,L>): this;
    }


    //////////////////////////////////////////////////////////////////////////////////////
    // Sankey Flow Chart
    //////////////////////////////////////////////////////////////////////////////////////
    interface SankeyLabelOptions<T> extends c3.Selection.Options<T> {
        orientation?: string;
    }
    export interface SankeyOptions<D, L> extends GraphOptions<D, L> {
        key?: (d: D) => number | string;
        value?: (d: D) => number;
        link_key?: (l: L) => number | string;
        link_source?: (l: L) => number | string;
        link_target?: (l: L) => number | string;
        link_value?: (l: L) => number;

        iterations?: number;
        alpha?: number;
        node_padding?: number | string;
        node_width?: number | string;
        align?: string;
        link_path?: string;
        link_path_curvature?: number;
        overflow_width_ratio?: number;

        nodes_options?: c3.Selection.Options<void>;
        node_options?: c3.Selection.Options<D>;
        rect_options?: c3.Selection.Options<D>;
        links_options?: c3.Selection.Options<void>;
        link_options?: c3.Selection.Options<L>;
        path_options?: c3.Selection.Options<L>;
        node_label_options?: SankeyLabelOptions<D>;
        link_label_options?: SankeyLabelOptions<L>;
    }
    interface Sankey<D,L> extends SankeyOptions<D,L> { }
    class Sankey<D, L> extends Graph<D, L> implements SankeyOptions<D, L> {
        nodes_layer: c3.Selection<void>;
        node_g: c3.Selection<D>;
        rects: c3.Selection<D>;
        links_layer: c3.Selection<void>;
        link_g: c3.Selection<L>;
        paths: c3.Selection<L>;

        current_data: D[];

        constructor(opt?: SankeyOptions<D,L>);
        render(opt?: SankeyOptions<D,L>): this;
    }

    module Sankey {
      //////////////////////////////////////////////////////////////////////////////////////
      // Butterfly Flow Chart
      //////////////////////////////////////////////////////////////////////////////////////
      export interface ButterflyOptions<D, L> extends SankeyOptions<D, L> {
        navigatable?: boolean;
        depth_of_field?: number;
        focal?: D;
        limit_nodes?: number;
        limit_links?: number;
      }
      interface Butterfly<D, L> extends ButterflyOptions<D, L> { }
      class Butterfly<D, L> extends Sankey<D, L> implements ButterflyOptions<D, L> {
        focal: D;

        constructor(opt?: ButterflyOptions<D, L>);
        render(opt?: ButterflyOptions<D, L>): this;

        focus(focal: D);
      }
    }
}
