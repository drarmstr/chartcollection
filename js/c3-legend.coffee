# C3 Visualization Library
# Legends

###################################################################
# Legend
###################################################################

# A Legend to display a list of items.
#
# It is important to set `item_options.text` or `item_options.html` to define how to
# display each element in the legend.  By default, the data elements will be converted to strings
# and displayed as raw text.  However, you will likely want to set a different accessor callback.
#
# ## Styling
# The list is created as a `ul` element.  The `hoverable` class is applied if appropriate.
# The `li` elements get the `parent` class if they have children.
# `li` elements have spans with either the `content` or `bullet` class as appropriate.
# @author Douglas Armstrong
class c3.Legend extends c3.Base
    @version: 0.2
    type: 'legend'

    # [Array] An array of data elements for the legend to display
    data: []
    # [Function] A callback used to determine a unique identification for each data element.
    # This is useful, for example, with animations when the dataset changes.
    key: undefined
    # [Function] A callback used to determine if a data element in the `data` array should be displayed.
    # It is passed with a data element as a parameter and should return `true` or `false`.
    # By default, legend items with no text or html defined will be omitted.
    filter: undefined
    # [Boolean, Function] Set to false to disable nested legend items.
    # Set to a function to return an array of nested items based on a data element in `data`.
    # By default it will treat `data` elements that are arrays as nested items.
    nest: undefined
    # [Function] A callback used to uniquely identify nested legend items.
    nest_key: undefined
    # [Boolean] enables _hoverable_ behaviour for the legend such as highlighting when the
    # mouse hovers or with a touch event.
    hoverable: true
    # [{c3.Selection.Options}] Options for the legend `ul` as a whole
    list_options: undefined
    # [{c3.Selection.Options}] Options to set the **styles** and **events** for the `li` items in the list.
    list_item_options: undefined
    # [{c3.Selection.Options}] Options to set the **text**, **html**, and other **styles** and
    # **events** for the content span for items in the list.
    # By default it will display data elements by converting them to a string.
    item_options: undefined
    # [Function] A callback to get a {c3.Selection.Options} object for the content span
    # based on a datum as an input parameter
    item_option: undefined
    # [{c3.Selection.Options}] Options for _nested_ `li` list items.
    # These will default to `list_item_options` unless specified.
    nested_list_item_options: undefined
    # [{c3.Selection.Options}] Options for _nested_ content spans for list items.
    # These will default to `item_options` unless specified.
    nested_item_options: undefined
    # [Boolean, {c3.Selection.Options}] Set to `false` to disable **bullets** for legend items.
    # Otherwise it is the {c3.Selection.Options options} to set the **text**, **html**, or other
    # options for the list item bullets.
    bullet_options: undefined
    # [Boolean, {c3.Selection.Options}] Options for **bullets** of _nested_ list items.
    # This will default to `bullet_options` unless specified.
    nested_bullet_options: undefined

    _init: =>
        # Default Options
        # * Legend items are the data elements converted to text
        # * Arrays represent nested items
        # * Items with no name are not displayed.
        @nest ?= (d)-> if Array.isArray(d) then d else []
        @item_options ?= {}
        if not @item_option?
          @item_options.text ?= (d)-> if Array.isArray(d) then "#{d.length} items" else d
          @filter ?= (d)=> @item_options.html?(d) ? @item_options.html ? @item_options.text?(d) ? @item_options.text
        @nested_list_item_options ?= @list_item_options
        @nested_item_options ?= @item_options
        @bullet_options ?= {}
        @bullet_options.text ?= "•"
        @nested_bullet_options ?= @bullet_options

        # Create the Legend List
        @list = c3.select(d3.select(@anchor),'ul').singleton()

    _update: =>
        # Pull the specified data from the input data array
        # NOTE: This is done before we temporarily delete the text/html options!
        @current_data = if @filter then (datum for datum,i in @data when @filter(datum,i)) else @data

        # Set overall list options
        @list.options(@list_options).update()

        # Create the Legend List Items
        @list_items = @list.select('ul:not(.child) > li').bind @current_data, @key
        @list_items.options(@list_item_options).update()
        @items = @list_items.inherit('span.content').options(@item_options, @item_option).update()

        # Create Bullets
        if @bullet_options
            @bullets = @list_items.inherit('ul:not(.child) > li > span.bullet',true,true)
            @bullets.options(@bullet_options).update()

        # Handle nested legend items
        if @nest
            @nested_items = @list_items.inherit('ul.child').select('li').bind @nest, @nest_key
            @nested_items.options(@nested_list_item_options).update()
            @nested_items.inherit('span.content').options(@nested_item_options).update()

            # Nested Bullets
            if @nested_bullet_options
                @nested_bullets = @nested_items.inherit('span.bullet',true,true)
                @nested_bullets.options(@nested_bullet_options).update()

        # Give any list items that have children the class `parent`
        @list_items.select('ul > li').all.each ->
            d3.select(this).node().parentNode.parentNode.classList.add('parent')

    _style: (style_new)=>
        @list.style().all.classed
            'c3': true
            'legend': true
            'hoverable': @hoverable
        @list_items.style(style_new)
        @items.style(style_new)
        @nested_items?.style(style_new)
        @bullets?.style(style_new)
        @nested_bullets?.style(style_new)


###################################################################
# Chart Plot Legend
###################################################################

# A type of {c3.Legend C3 Legend} that is linked with a {c3.Plot C3 Chart Plot}.
# It will display each {c3.Plot.Layer layer} in the plot as a legend items.
# For stacked layers, each {c3.Plot.Layer.Stackable.Stack stack} will be a nested item.
# The names in the legend will be based on the `name` attribute of the layers and stacks.
# If the `name` is `false`, then the layer will not be displayed.
#
# The legend is linked with the plot, so hovering over the legend items will highlight the
# cooresponding data in the plot.  The functionality leverages the base {c3.Legend legend} and
# can be further customized or adjusted by the user.
#
# @see c3.Legend
# @see c3.Plot
# @todo Support for swimlane layer types
# @todo Create a Legend type for Pie charts
# @todo Support for decimated layers
# @author Douglas Armstrong
class c3.Legend.PlotLegend extends c3.Legend
    @version: 0.1
    type: 'plot_legend'

    # [{c3.Plot}] Plot to link with this legend
    plot: undefined
    # [Boolean] Invert the order of the layers in the legend.
    # * `false` - Layers on top are at the top of the legend.
    # * `true` - Layers on top are at the bottom of the legend.
    invert_layers: false
    # [Boolean] By default, the layer and stack names will display as raw text.  If you would like
    # HTML tags in the name string to render as HTML, then enable this option.  Please be careful of
    # user-provided strings and security.
    html_names: false
    # [Number] When hovering over an item the other layers/stacks in the plot will fade to this
    # percentage of their original opacity.
    hover_fade: 0.2
    # [Number] The duration in milliseconds that animations should take, such as stacked elements
    # floating down to the bottom of the chart.
    duration: 750

    _init: =>
        if not @plot? then throw Error "Plot legend must have a plot option refering to a c3.Plot."
        if @plot not instanceof c3.Plot then throw Error "Plot option must reference a c3.Plot type object."
        if not @plot.rendered then throw Error "plot_legend's linked plot should be rendered before rendering the legend."

        # Setup default data to refer to the layers and stacks in a C3 plot
        @key ?= (layer)-> layer.uid
        @nest ?= (layer)-> layer.stacks ? []
        @list_item_options ?= {}
        @item_options ?= {}
        @nested_list_item_options ?= {}
        @nested_item_options ?= {}
        @nest_key ?= (stack)-> stack.key ? stack.name

        # Callbacks to get the layer and stack names and titles
        layer_title = (layer,i)=> layer.options?.title ? @plot.layer_options?.title?(layer,i) ? @plot.layer_options?.title ? layer.name
        layer_name = (layer,i)-> layer.name ? layer_title(layer,i) ? layer.type
        stack_title = (stack, stack_idx, layer_idx)=>
            layer = @plot.layers[layer_idx]
            stack.options?.title ? layer?.stack_options?.title?(stack) ? layer?.stack_options?.title ? stack.name
        stack_name = (stack, stack_idx, layer_idx)->
            stack.name ? stack_title(stack, stack_idx, layer_idx) ? "stack"

        # Setup the legend names and titles
        if @html_names
            @item_options.html ?= layer_name
            @nested_item_options.html ?= stack_name
        else
            @item_options.text ?= layer_name
            @nested_item_options.text ?= stack_name
        @item_options.title ?= layer_title
        @nested_item_options.title ?= stack_title

        if @hoverable
            # Highlight the layers in the chart when hovering over the legend.
            @list_item_options.events ?= {}
            @list_item_options.events.mouseenter ?= (hover_layer, hover_layer_idx)=>
                # Fade other layers
                fade = @hover_fade
                @plot.layers_selection.all.style 'opacity', (layer,i)->
                    old_opacity = d3.select(this).style('opacity') ? 1
                    if layer isnt hover_layer then fade * old_opacity else old_opacity
                @trigger 'layer_mouseenter', hover_layer, hover_layer_idx
            @list_item_options.events.mouseleave ?= (hover_layer, hover_layer_idx)=>
                # Restore all layers to their proper opacity
                @plot.layers_selection.all.style 'opacity', (layer,i)=>
                    layer.options?.styles?.opacity?(layer,i) ? layer.options?.styles?.opacity ?
                    layer.styles?.opacity?(layer,i) ? layer.styles?.opacity ? 1
                @trigger 'layer_mouseleave', hover_layer, hover_layer_idx

            # Highlight the stacks in the chart layer when hovering over nested items
            @nested_list_item_options.events ?= {}
            @nested_list_item_options.events.mouseenter ?= (hover_stack, hover_stack_idx, hover_layer_idx)=>
                layer = @plot.layers[hover_layer_idx]

                # Fade other stacks
                fade = @hover_fade
                layer.groups.all.style 'opacity', (stack,i)->
                    old_opacity = d3.select(this).style('opacity') ? 1
                    if stack isnt hover_stack then fade * old_opacity else old_opacity

                # Animate stacked bar chart stacks to the baseline for comparison
                duration = @duration
                layer.rects?.all.filter((d,i,stack_idx)->stack_idx is hover_stack_idx)
                    .transition().duration(duration).attr 'transform', ->
                        rect = d3.select(this)
                        "translate(0,#{layer.v.range()[0]-rect.attr('y')-rect.attr('height')})"

                # Animate stacked line/area chart stacks to the baseline
                if layer.path_generator?
                    # Cache the current paths for the stacks in the layer
                    @layer_paths_cached = cache = []
                    layer.paths?.all.each (path, path_idx)->
                        cache[path_idx] = d3.select(this).attr 'd'
                    layer.paths?.all.filter((stack,stack_idx)-> stack_idx is hover_stack_idx)
                        .transition().duration(duration).attr 'd', (stack, stack_idx)->
                            layer.path_generator
                                .x (d,i)-> (layer.chart.orig_h ? layer.h) stack.values[i].x # TODO Hack, cleanup with migration to zoom as a mix-in
                                .y (d,i)-> layer.v stack.values[i].y
                                .y0 layer.v.range()[0]
                            layer.path_generator(stack.current_data)

                @trigger 'stack_mouseenter', hover_stack, hover_stack_idx, hover_layer_idx

            @nested_list_item_options.events.mouseleave ?= (hover_stack, hover_stack_idx, hover_layer_idx)=>
                layer = @plot.layers[hover_layer_idx]

                # Restore all stacks to their proper opacity
                layer.groups.all.style 'opacity', (stack,i)=>
                    layer.stack_options?.styles?.opacity?(stack,i) ? layer.stack_options?.styles?.opacity ? 1

                # Restore stacked bar charts that were floated to the baseline
                layer.rects?.all.transition().duration(@duration).attr 'transform', ''

                # Restore stacked line/area charts that were floated to the baseline
                layer.paths?.all.interrupt()
                if layer.paths?
                    # If we have the paths for the stacks in the layer cached, then
                    # restore them cheaply.  Otherwise, recompute the paths based on the
                    # current data.
                    if @layer_paths_cached?
                        layer.paths?.all.filter((stack,stack_idx)-> stack_idx is hover_stack_idx)
                            .attr 'd', @layer_paths_cached[hover_stack_idx]
                    else
                        layer.draw()

                @trigger 'stack_mouseleave', hover_stack, hover_stack_idx, hover_layer_idx

        super
        @list.all.classed 'plot_legend', true
        # When the linked plot's style is updated, update the legend styles
        @plot.on 'restyle.legend', @restyle

    _update: =>
        # Clear any cached layer state.
        delete @layer_paths_caches

        # Create empty bullets to be populated with SVG glyphs.
        delete @bullet_options.text
        delete @bullet_options.html

        # Setup default data to refer to the layers in a C3 plot
        @data = @plot.layers
        super
        if @invert_layers
            @list_items.all.order()
        else
            @list_items.all.sort((a,b)=> @plot.layers.indexOf(a) < @plot.layers.indexOf(b))

        # Create an SVG glyph for each layer or stack.  Bind it to an example "node" in the
        # plot's actual layer that will represent what styles we should copy for the legend.
        size = 16
        generate_glyph = (svg, layer, stack_idx=0)->
            # Depending on the layer type create an SVG glyph.
            # Relying on the layer type may not be the cleanest approach.  Might be better to
            # have the layer implementations themselves provide a glyph..
            if layer instanceof c3.Layer.Line
                node = layer.paths.all[0][stack_idx]
                svg.select('line').singleton(node).position { x1:0, y1:size/2, x2:size, y2:size/2 }
            else if layer instanceof c3.Layer.Line.Horizontal
                node = layer.lines.all.node()
                svg.select('line').singleton(node).position { x1:0, y1:size/2, x2:size, y2:size/2 }
            else if layer instanceof c3.Layer.Line.Vertical
                node = layer.lines.all.node()
                svg.select('line').singleton(node).position { x1:size/2, y1:0, x2:size/2, y2:size }
            else if layer instanceof c3.Layer.Scatter
                node = layer.circles.all.node()
                svg.select('circle').singleton(node).position { cx:size/2, cy:size/2, r:size/4 }
            else # Area, Bar, Region, & default (including swimlanes for now)
                node = layer.paths?.all[0][stack_idx] ? layer.rects?.all[stack_idx][0] ? layer.groups?.all.node() ? layer.g.node()
                svg.select('rect').singleton(node).position
                    x: size*0.1
                    y: size*0.1
                    height: size*0.8
                    width: size*0.8
                    rx: size/5
                    ry: size/5

        # Create SVG glyphs for legend items
        @bullets_svg = @bullets.inherit('svg')
        @bullets_svg.all.attr
            height: size
            width: size
        @bullets_svg.all.each (layer)->
            if not layer.stacks?
                generate_glyph c3.select(d3.select(this)), layer
            else d3.select(this.parentNode).remove()

        # Create glyphs for nested legend items.
        @nested_bullets_svg = @nested_bullets.inherit('svg')
        @nested_bullets_svg.all.attr
            height: size
            width: size
        plot = @plot
        @nested_bullets_svg.all.each (stack, stack_idx, layer_idx)->
            layer = plot.layers[layer_idx]
            generate_glyph c3.select(d3.select(this)), layer, stack_idx

    _style: =>
        super
        # Style the glyphs in the legend to match the styles of their cooresponding
        # nodes in the plot.
        @list.all.selectAll('li > .bullet > svg > *').each (node)-> if node
            glyph = d3.select(this)
            src_styles = getComputedStyle(node)
            for style in ['stroke', 'stroke-dasharray', 'stroke-width', 'fill', 'opacity']
                glyph.style style, src_styles.getPropertyValue(style)
