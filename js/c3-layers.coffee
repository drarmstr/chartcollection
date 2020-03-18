# c3 Visualization Library
# Layers for XY Plots

###################################################################
# XY Plot Chart Layers
###################################################################

# The root abstract class of layers for the {c3.Plot c3 XY Plot Chart}
#
# ## Internal Interface
# The internal interface that plot layers can implement essentially match the {c3.Base} internal abstract interface:
# * **{c3.base#init init()}**
# * **{c3.base#size size()}**
# * **{c3.base#update update()}**
# * **{c3.base#draw draw()}**
# * **{c3.base#style style()}**
#
# An additional method is added:
# * **zoom()** - Called when the chart is zoomed or panned.
#
# ## Extensibility
# Each layer has the following members added:
# * **chart** - Reference to the {c3.Plot XY Plot Chart} this layer belongs to
# * **content** - A {c3.Selection selection} of the layer content
# * **g** - A {https://github.com/mbostock/d3/wiki/Selections D3 selection} for the SVG g node for this layer
# * **width** - width of the layer
# * **height** - height of the layer
#
# @method #on(event, handler)
#   Register an event handler to catch events fired by the visualization.
#   @param event [String] The name of the event to handle.  _See the Exetensibility and Events section for {c3.base}._
#   @param handler [Function] Callback function called with the event.  The arguments passed to the function are event-specific.
#
# Items should be positioned on the the layer using the layer's `h` and `v` scales.
# As a performance optimization some layers may create a g node with the `scaled` class.
# When the plot is zoomed then this group will have a transform applied to reflect the zoom so
# individual elements do not need to be adjusted.  Please use the `chart.orig_h` scale in this case.
# Not that this approach does not work for many circumstances as it affects text aspect ratio,
# stroke widths, rounding errors, etc.
# @abstract
# @author Douglas Armstrong
class c3.Plot.Layer
    @version: 0.2
    c3.Layer = this # Shortcut for accessing plot layers.
    type: 'layer'
    @_next_uid: 0

    # [Array] Data for this layer  _This can be set for each individual layer or a default for the entire chart._
    data: undefined
    # [String] User name for this layer.  This is used in legends, for example.
    name: undefined
    # [String] CSS class to assign to this layer for user style sheets to customize
    class: undefined
    # [Boolean] If true this layer is considered to have "static" data and will not update when {c3.Base#redraw redraw()} is called.
    static_data: false
    # [{https://github.com/mbostock/d3/wiki/Scales d3.scale}] Scale for the _vertical_ Y axis for this layer.
    # Please set the _domain()_, c3 will set the _range()_.
    # _The vertical scale may be set for the entire chart instead of for each layer._
    h: undefined
    # [{https://github.com/mbostock/d3/wiki/Scales d3.scale}] Scale for the _vertical_ Y axis for this layer.
    # Please set the _domain()_, c3 will set the _range()_.
    # _The vertical scale may be set for the entire chart instead of for each layer._
    v: undefined
    # [Function] An accessor function to get the X value from a data item.
    # _This can be set for each individual layer or a default for the entire chart._
    # Some plots support calling this accessor with the index of the data as well as the datum itself.
    x: undefined
    # [Function] An accessor function to get the Y value from a data item.
    # _This can be set for each individual layer or a default for the entire chart._
    # Some plots support calling this accessor with the index of the data as well as the datum itself.
    y: undefined
    # [String] `left` for 0 to be at the left, `right` for the right.
    h_orient: undefined
    # [String] `top` for 0 to be at the top, `bottom` for the bottom.
    v_orient: undefined
    # [{c3.Selection.Options}] Options to set the **class**, **classes**, **styles**,
    # **events**, and **title** for this layer.
    options: undefined
    # [Object] An object to setup event handlers to catch events triggered by this c3 layer.
    # The keys represent event names and the values are the cooresponding handlers.
    handlers: undefined

    constructor: (opt)->
        c3.util.extend this, new c3.Dispatch
        c3.util.extend this, opt
        @uid = c3.Plot.Layer._next_uid++

    # Internal function for the Plot to prepare the layer.
    init: (@chart, @g)=>
        @trigger 'render_start'
        @data ?= @chart.data
        @h ?= @chart.h
        @v ?= @chart.v
        @x ?= @chart.x
        @y ?= @chart.y
        @h_orient ?= @chart.h_orient
        @v_orient ?= @chart.v_orient
        if @class? then @g.classed @class, true
        if @handlers? then @on event, handler for event, handler of @handlers
        @content = c3.select(@g)

        # Apply classes to layer g nodes based on the `type` of the layer object hierarchy
        prototype = Object.getPrototypeOf(@)
        while prototype
            if prototype.type? then @g.classed prototype.type, true
            prototype = Object.getPrototypeOf prototype

        @_init?()
        @trigger 'render'

    # Resize the layer, but _doesn't_ update the rendering, `resize()` should be used for that.
    size: (@width, @height)=>
        @trigger 'resize_start'
        if @h_orient != @chart.h_orient and @h == @chart.h then @h = @h.copy()
        c3.d3.set_range @h, if @h_orient is 'left' then [0, @width] else [@width, 0]
        if @v_orient != @chart.v_orient and @v == @chart.v then @v = @v.copy()
        c3.d3.set_range @v, if @v_orient is 'bottom' then [@height, 0] else [0, @height]
        @_size?()
        @trigger 'resize'

    # Update the DOM bindings based on the new or modified data set
    update: (origin)=>
        if not @chart? then throw Error "Attempt to redraw uninitialized plot layer, please use render() when modifying set of layers."
        @trigger 'redraw_start', origin
        @_update?(origin)

    # Position the DOM elements based on current scales.
    draw: (origin)=>
        if not (@static_data and origin is 'redraw')
            @trigger 'redraw_start', origin if origin is 'resize'
            @_draw?(origin)
            @trigger 'redraw', origin

    # Restyle existing items in the layer
    style: (style_new)=>
        @trigger 'restyle_start', style_new
        @_style?(style_new)
        @trigger 'restyle', style_new
        @trigger 'rendered' if not @rendered
        return this

    # Called when a layer needs to update from a zoom, decimated layers overload this
    zoom: =>
        @draw?('zoom')
        @style?(true)

    # Called when a layer needs to update from vertical panning
    pan: =>
        @draw?('pan')
        @style?(true)

    # Redraw just this layer
    redraw: (origin='redraw')=>
        @update(origin)
        @draw(origin)
        @style(true)
        return this

    # Method to restyle this layer
    restyle: Layer::style

    # Adjust domains for layer scales for any automatic domains.
    # For layer-specific automatic domains the layer needs its own scale defined,
    # it cannot update the chart's shared scale.
    # @note Needs to happen after update() so that stacked layers are computed
    scale: =>
        refresh = false
        if @h_domain?
            if @h==@chart.h then throw Error "Layer cannot scale shared h scale, please define just h or both h and h_domain for layers"
            h_domain = if typeof @h_domain is 'function' then @h_domain.call(this) else @h_domain
            if h_domain[0] is 'auto' then h_domain[0] = @min_x()
            if h_domain[1] is 'auto' then h_domain[1] = @max_x()
            if h_domain[0]!=@h.domain()[0] or h_domain[1]!=@h.domain()[1]
                @h.domain h_domain
                refresh = true
        if @v_domain?
            if @v==@chart.v then throw Error "Layer cannot scale shared v scale, please define just v or both v and v_domain for layers"
            v_domain = if typeof @v_domain is 'function' then @v_domain.call(this) else @v_domain
            if v_domain[0] is 'auto' then v_domain[0] = @min_y()
            if v_domain[1] is 'auto' then v_domain[1] = @max_y()
            if v_domain[0]!=@v.domain()[0] or v_domain[1]!=@v.domain()[1]
                @v.domain v_domain
                refresh = true
        return refresh

    min_x: => if @x? then d3.min @data, @x
    max_x: => if @x? then d3.max @data, @x
    min_y: => if @y? then d3.min @data, @y
    max_y: => if @y? then d3.max @data, @y


###################################################################
# XY Plot Stackable Layers
###################################################################

# An **abstract** class for layers that support stacking
# such as {c3.Plot.Layer.Path} and {c3.Plot.Layer.Bar}.
#
# **Stacking** allows the user to group their data into different _stacks_, which are stacked
# on top of each other in the chart.  Stacking is enabled when you define _either_ `stack_options.key`, `stacks`,
# or both options.  `stack_options` allows you to configure how stacking is performed from the layer's data,
# while `stacks` allows you to manually configure the exact set of stacks.
#
# This layer stacking is flexible to support several different ways of organizing the dataset into stacks:
# * For normalized datasets you can define a `stack_options.key()` accessor to provide a key that uniquely
#   identifies which stack an element belongs to.
# * Otherwise, you can manually define the set of `stacks` and the layer's `data` is copied into each.
# * * The layer `y` accessor will be called with the arguments (_datum_,_index_,_stack_)
#   for you to provide the value for that element for that stack.
# * * Or, you can define a `y` accessor for each stack to get the value for that element for that stack.
# * You can also directly define `data` in each stack specified in `stacks`.
#
# Please view the examples for more explanation on how to stack data.
# Remember, the set and order or stacks can always be programmatically constructed and dynamically updated.
#
# ## Extensibility
# The following {c3.Selection} members are made available if appropriate:
# * **groups** - An entry will exist for an svg:g node for each stack in the layer
#
# @see ../../../examples/doc/stack_example.html
# @abstract
# @author Douglas Armstrong
# @note If stacked, the input datasets may not have duplicate values in the same stack for the same X value.  There are other resitrictions if `safe` mode is not used.
# @note If you do not provide data elements for all stacks at all x values, then be prepared for your accessor callbacks to be called with _null_ objects.
class c3.Plot.Layer.Stackable extends c3.Plot.Layer
    @version: 0.2
    type: 'stackable'

    # [{c3.Selection.Options}] Enable stacking and specify stacking options for this layer.
    # This provides the normal {c3.Selection.Options} applied to each stack in the layer.  For callbacks,
    # the first argument is the stack object and the second argument is the index to the stack
    # In addition, the following options control stacking behaviour:
    # * **key** [Function] An accessor you can define to return a key that uniquely identifies which stack
    #   a data element belongs to.  If this is specified, then this callback is used to determine which stack
    #   each data element is assigned to.  Otherwise, the layer data array is used in full for each stack.
    # * **name** [Function] A callback you define to set the name of a stack that is passed the stack key as an argument.
    # * **offset** [String, Function] The name or a function for the stacking algorithm used to place the data.
    #   See {https://github.com/mbostock/d3/wiki/Stack-Layout#wiki-offset d3.stack.offset()} for details.
    # * * `none` - Do not stack the groups.  Useful for grouped line charts.
    # * * `zero` - The default for a zero baseline.
    # * * `expand` - Normalize all points to range from 0-1.
    # * **order** [String] Specify the mechanism to order the stacks.
    #   See {https://github.com/mbostock/d3/wiki/Stack-Layout#wiki-order d3.stack.order()} for details.
    stack_options: undefined

    # [Array<{c3.Plot.Layer.Stackable.Stack}>] An array of {c3.Plot.Layer.Stackable.Stack stack}
    # objects that can be used to manually specify the set of stacks.
    # Stack objects may contain:
    # * **key** [String] The key for this stack
    # * **y** [Function] A y accessor to use for this stack overriding the one provided by the chart or layer.
    # * **data** [Array] Manually specified dataset for this stack instead of using the layer's `data`.
    # * **name** [String] Name for the stack
    # * **options** [{c3.Selection.Options}] Options to manually set the **class**, **classes**,
    #   **styles**, **events**, and **title** of just this stack.
    stacks: undefined

    # [Boolean] Safe Mode.
    # Preform additional checks and fix up the data for situations such as:
    # * Data not sorted along X axis
    # * Remove data elements where X or Y values are undefined
    # * Pad missing values where stacks are not defined for all X values.
    # Note that this mode may cause the indexes passed to the accessors to match the
    # corrected data instead of the original data array.
    safe: true

    # Restack the data based on the **stack** and **stacks** options.
    _stack: => if @stack_options or @stacks?
        @stacks ?= []
        x_values_set = {}

        # Helper function to setup the current stack data and populate a shadow structure
        # to hold the x, y, and y0 positioning so we avoid modifying the user's data.
        add_value = (stack, datum, i, j)=>
            x = @x(datum,i); x_values_set[x] = x
            stack.y = stack.y ? @y ? throw Error "Y accessor must be defined in stack, layer, or chart"
            y = stack.y(datum, i, j, stack)
            stack.values.push { x:x, y:y, datum:datum }

        for stack, j in @stacks
            stack.name ?= @stack_options?.name? stack.key

            # Clear any previous stacking
            stack.values = [] # Shadow array to hold stack positioning

            # Data was provided manually in the stack definition
            if stack.data? then for datum, i in stack.data
                add_value stack, datum, i, j

        # Data has been provided in @current_data that we need to assign it to a stack
        if @current_data.length
            # Use stack_options.key() to assign data to stacks
            if @stack_options?.key?
                stack_map = {}
                stack_index = {}
                for stack, j in @stacks # Refer to hard-coded stacks if defined
                    if stack_map[stack.key]? then throw Error "Stacks provided with duplicate keys: "+stack.key
                    stack_map[stack.key] = stack
                    stack_index[stack.key] = j
                for datum, i in @current_data
                    key = @stack_options.key(datum)
                    if stack_map[key]?
                        stack = stack_map[key]
                        j = stack_index[key]
                    else
                        @stacks.push stack = stack_map[key] = {
                            key:key, name:@stack_options.name?(key), current_data:[], values:[] }
                        j = @stacks.length
                    add_value stack, datum, i, j

            # Otherwise, assign all data to all stacks using each stack's y() accessor
            else if @stacks? then for stack, j in @stacks
                for datum, i in @current_data
                    add_value stack, datum, i, j

            else throw Error "Either stacks or stack_options.key must be defined to create the set of stacks."

        if @safe
            # Ensure everything is sorted
            # NOTE: We sort based on the @h scale in case of ordinal or other odd scales
            if @h.range()[0] is @h.range()[1] then @h.range [0,1]
            x_values = c3.array.sort_up (v for k,v of x_values_set), @h
            for stack in @stacks
                c3.array.sort_up stack.values, (v)=> @h v.x

            # Splice in missing data and remove undefined data (Important for D3's stack layout)
            i=0; while i<x_values.length
                undef = 0
                for stack in @stacks
                    # Check for missing values
                    # Compare using h scale to tolerate values such as Dates
                    stack_h = @h stack.values[i]?.x
                    layer_h = @h x_values[i]
                    if stack_h isnt layer_h
                        if stack_h < layer_h # Check for duplicate X values
                            if @h.domain()[0] is @h.domain()[1]
                                throw Error "Did you intend for an h scale with 0 domain?  Duplicate X values, invalid stacking, or bad h scale"
                            else throw Error "Multiple data elements with the same x value in the same stack, or invalid stacking"
                        stack.values.splice i, 0, { x:x_values[i], y:0, datum:null }
                        undef++
                    # Check for undefined y values
                    else if not stack.values[i].y?
                        stack.values[i].y = 0
                        undef++
                # If item is undefined for all stacks, then remove it completely
                if undef is @stacks.length
                    stack.values.splice(i,1) for stack in @stacks
                    x_values.splice(i,1)
                    i--
                i++

        # Prepare array of current data for each stack in case it is needed for binding (used by bar chart)
        for stack in @stacks
            stack.current_data = stack.values.map (v)->v.datum

        # Configure and run the D3 stack layout to generate y0 and y layout data for the elements.
        if @stack_options?.offset == 'none'
            for stack in @stacks
                for value in stack.values
                    value.y0 = 0
        else
            stacker = d3.layout.stack().values (stack)->stack.values
            if @stack_options?.offset? then stacker.offset @stack_options.offset
            if @stack_options?.order? then stacker.order @stack_options.order
            stacker @stacks

    _update: =>
        # Ensure data is sorted and skip elements that do not have a defined x or y value
        @current_data = if not @safe then @data else if @data?
            # TODO: we could try to use this values array later as an optimization and for more
            # stable i parameters passed to user accessors.  However, it will complicate the code.
            if @y? and not @stacks? and not @stack_options?
                values = ({x:@x(d,i), y:@y(d,i), datum:d} for d,i in @data)
                c3.array.sort_up values, (v)=> @h v.x # Use @h to accomodate date types
                (v.datum for v in values when v.x? and v.y?)
            else
                values = ({x:@x(d,i), datum:d} for d,i in @data)
                if @stacks? or @stack_options? # Sorting handled by _stack()
                    c3.array.sort_up values, (v)=> @h v.x
                (v.datum for v in values when v.x?)
        @current_data ?= []

        @_stack()
        @groups = @content.select('g.stack')
            .bind (@stacks ? [null]), if not @stacks?[0]?.key? then null else (stack)->stack.key
            .options @stack_options, (if @stacks?.some((stack)->stack.options?) then (stack)->stack.options)
            .update()

    _style: (style_new)=> @groups?.style(style_new)

    min_x: => if not @stacks? then super else d3.min @stacks[0]?.values, (v)-> v.x
    max_x: => if not @stacks? then super else d3.max @stacks[0]?.values, (v)-> v.x
    min_y: => if not @stacks? then super else
        d3.min @stacks, (stack)-> d3.min stack.values, (v)-> v.y0 + v.y
    max_y: => if not @stacks? then super else
        d3.max @stacks, (stack)-> d3.max stack.values, (v)-> v.y0 + v.y

# A _struct-type_ convention class to describe a stack when manually specifying the set of stacks
# to use for a stackable chart layer.
class c3.Plot.Layer.Stackable.Stack
    @version: 0.1

    # [String] The key for this stack
    key: undefined
    # [Function] A _y accessor_ to use for this stack, overriding the one provided by the chart or layer.
    y: undefined
    # [Array] An array of data elements to use for this stack instead of the layer or chart's `data`.
    data: undefined
    # [String] Name for the stack
    name: undefined
    # [{c3.Selection.Options}] Options to manually set the **class**, **classes**,
    # **styles**, **events**, and **title** of just this stack.
    options: undefined

    constructor: (opt)-> c3.util.extend this, opt


###################################################################
# XY Plot Line and Area Layers
###################################################################

# Abstract chart layer for the {c3.Plot XY Plot Chart}.
# Please instantiate a {c3.Plot.Layer.Line} or {c3.Plot.Layer.Area}
# @see c3.Plot.Layer.Line
# @see c3.Plot.Layer.Area
#
# Define an `r` or `a` to create circles at the various data points along the path
# with that associated radius or area.
#
# ## Extensibility
# The following {c3.Selection} members are made available if appropriate:
# * **paths** - There will be an element in paths for each stack in the layer
# * **circles** - Circles for each datapoint
# * **labels** - Labels for each datapoint
#
# @abstract
# @author Douglas Armstrong
class c3.Plot.Layer.Path extends c3.Plot.Layer.Stackable
    @version: 0.2
    type: 'path'

    # [Function] Factory to generate an SVG path string generator function.  _See {https://github.com/mbostock/d3/wiki/SVG-Shapes#path-data-generators} for details.
    path_generator_factory: undefined
    # [String] The type of D3 line interpolation to use.  _See {https://github.com/mbostock/d3/wiki/SVG-Shapes#area_interpolate d3.svg.area.interpolate} for options._  Some useful examples:
    # * _linear_ - Straight lines between data points
    # * _basis_ - Smooth curve based on a B-spline, the curve may not touch the data points
    # * _cardinal_ - Smooth curve that intersects all data points.
    # * _step-before_ - A step function where the horizontal segments are to the left of the data points
    # * _step-after_ - A step function where the horizontal segments are to the right of the data points
    interpolate: undefined
    # [Number] The tension value [0,1] for cardinal interpolation.  _See {https://github.com/mbostock/d3/wiki/SVG-Shapes#area_tension d3.svg.area.tension}._
    tension: undefined
    # [Function] Accessor function you can return true or false if the data point in data[] is defined or should be skipped.  _See {https://github.com/mbostock/d3/wiki/SVG-Shapes#wiki-area_defined d3.svg.area.defined}._
    # Note that this will cause disjoint paths on either side of the missing element,
    # it will not render a continuous path that skips the undefined element.  For that
    # behaviour simply enable `safe` mode and have the x or y accessor return undefined.
    defined: undefined
    # [Number, Function] Define to create circles at the data points along the path with this radius.
    r: undefined
    # [Number, Function] Define to create circles at the data points along the path with this area.
    # Takes precedence over r.
    a: undefined
    # [{c3.Selection.Options}] Options for the svg:path.  For example, to enable animations.
    path_options: undefined
    # [{c3.Selection.Options}] If circles are created at the data points via `r` or `a`, then this
    # defines options used to style or extend them.
    circle_options: undefined
    # [{c3.Selection.Options}] Create labels for each datapoint with these options
    label_options: undefined

    _init: =>
        if not @path_generator_factory? then throw Error "path_generator_factory must be defined for a path layer"
        @path_generator = @path_generator_factory()

    _update: (origin)=> if origin isnt 'zoom'
        super

        @paths = @groups.inherit('path.scaled').options(@path_options)

        # Bind the datapoint circles and labels
        if @r? or @a?
            @circles = @groups.select('circle').options(@circle_options).animate(origin is 'redraw')
                .bind(if @stacks? then (stack)->stack.current_data else @current_data).update()
        if @label_options?
            @labels = @groups.select('text').options(@label_options).animate(origin is 'redraw')
                .bind(if @stacks? then (stack)->stack.current_data else @current_data).update()

    _draw: (origin)=>
        # Only need to update the paths if the data has changed
        if origin isnt 'zoom'
            # Update the path generator based on the current settings
            if @interpolate? then @path_generator.interpolate @interpolate
            if @tension? then @path_generator.tension @tension
            if @defined? then @path_generator.defined @defined

            # Generate and render the paths.
            orig_h = @chart.orig_h ? @h # For rendering on the scaled layer
            @paths.animate(origin is 'redraw').position
                d: if @stacks? then (stack, stack_idx)=>
                        @path_generator
                            .x (d,i)=> orig_h stack.values[i].x
                            .y (d,i)=> @v (stack.values[i].y0 + stack.values[i].y)
                            .y0? if @baseline? and not stack_idx then (d,i)=> @v c3.functor(@baseline)(d,i) else
                                (d,i)=> @v(stack.values[i].y0)
                        @path_generator(stack.current_data) # Call the generator with this particular stack's data
                    else =>
                        @path_generator
                            .x (d,i)=> orig_h @x(d,i)
                            .y (d,i)=> @v @y(d,i)
                            .y0? if @baseline? then (d,i)=> @v c3.functor(@baseline)(d,i) else @height
                        @path_generator(@current_data)

        # Position the circles
        @circles?.animate(origin is 'redraw').position
            cx: (d,i,s)=> @h @x(d,i,s)
            cy:
                if @stacks? then (d,i,s)=> values = @stacks[s].values[i]; @v values.y+values.y0
                else (d,i)=> @v @y(d,i)
            r: if not @a? then @r else
                if typeof @a is 'function' then (d,i,s)=> Math.sqrt( @a(d,i,s) / Math.PI )
                else Math.sqrt( @a / Math.PI )

        # Set the labels
        @labels?.animate(origin is 'redraw').position
            transform: (d,i,s)=> 'translate('+(@h @x(d,i,s))+','+(@v @y(d,i,s))+')'

    _style: (style_new)=>
        super
        @paths.style(style_new)
        @circles?.style(style_new)
        @labels?.style(style_new)

    min_x: => if not @stacks? then (if @data.length then @x @data[0]) else @stacks[0]?.values[0]?.x
    max_x: => if not @stacks? then (if @data.length then @x @data.slice(-1)[0]) else @stacks[0]?.values.slice(-1)[0]?.x

# Line graph layer for the {c3.Plot XY Plot Chart}.  Please refer to {c3.Plot.Layer.Path} for documentation.
# @see c3.Plot.Layer.Path
# @author Douglas Armstrong
class c3.Plot.Layer.Line extends c3.Plot.Layer.Path
    type: 'line'
    path_generator_factory: d3.svg.line


# Area graph layer for the {c3.Plot XY Plot Chart}.  Please refer to {c3.Plot.Layer.Path} for documentation.
# @see c3.Plot.Layer.Path
# @author Douglas Armstrong
# @note The input data array should be sorted along the x axis.
class c3.Plot.Layer.Area extends c3.Plot.Layer.Path
    type: 'area'
    path_generator_factory: d3.svg.area
    # [Number, Function] Base value or accessor for the bottom of the area chart.
    # _Defaults to the bottom of the chart._
    baseline: undefined


###################################################################
# XY Plot Bar Layer
###################################################################

# Bar chart layer for the {c3.Plot XY Plot Chart}
#
# Bar charts may have positive or negative values unless they are stacked,
# then they must be positive.
#
# When an orinal scale is used this layer will adjust it so that it provides padding
# so the full bar on the left and right ends are fully visible.  With other types of scales
# the bars may have arbitrary x values from the user and may overlap.  In this case, it is up
# to the user to set the domain so bars are fully visible.
#
# ## Extensibility
# The following {c3.Selection} members are made available if appropriate:
# * **rects**
#
# @todo Support negative y values for bar layers
# @author Douglas Armstrong
class c3.Plot.Layer.Bar extends c3.Plot.Layer.Stackable
    @version: 0.2
    type: 'bar'

    # [Function] A callback to describe a unique key for each data element.
    # This is useful for animations during a redraw when updating the dataset.
    key: undefined
    # [Number, String, Function] Specify the width of the bars.
    # If this is a number it specifies the bar width in pixels.
    # If this is a string, such as `50%`, then it can specify the width of the bars as a
    # percentage of the available space for each bar based on proximity to each neighbor.
    # If this is a function it can set the width dynamically for each bar.
    bar_width: "50%"
    # [{c3.Selection.Options}] Options for the svg:rect's.
    # The callbacks are called with the user data for the rect as the first argument, the index of that
    # datum as the second argument, and the index of the stack for this rect as the third argument.
    # `stack.options` can be used instead to apply the same options to an entire stack.
    rect_options: undefined

    _update: =>
        super
        @rects = @groups.select('rect').options(@rect_options).animate('origin is redraw')
            .bind((if @stacks? then ((stack)->stack.current_data) else @current_data), @key).update()

    _draw: (origin)=>
        baseline = @v(0)

        # Set bar_width and bar_shift
        if typeof @bar_width is 'function'
            bar_width = @bar_width
            bar_shift = -> bar_width(arguments...) / 2
        else
            bar_width = +@bar_width
            if !isNaN bar_width # The user provided a simple number of pixels
                @h.rangeBands? @h.rangeExtent(), 1, 0.5 # Provide padding for an ordinal D3 scale
                bar_shift = bar_width/2
            else # The user provided a percentage
                if @bar_width.charAt?(@bar_width.length-1) is '%' # Use charAt to confirm this is a string
                    bar_ratio = +@bar_width[..-2] / 100
                    if isNaN bar_ratio then throw "Invalid bar_width percentage "+@bar_width[0..-2]
                    if @h.rangeBands? # Setup padding for an ordinal D3 scale
                        @h.rangeBands @h.rangeExtent(), 1-bar_ratio, 1-bar_ratio
                        bar_width = @h.rangeBand()
                        bar_shift = 0
                    else # Dynamically compute widths based on proximity to neighbors
                        bar_width = if @stacks? then (d,i,j)=>
                                values = @stacks[j].values
                                mid = @h values[i].x
                                left = @h if !i then (@chart.orig_h ? @h).domain()[0] else values[i-1].x
                                right = @h if i==values.length-1 then (@chart.orig_h ? @h).domain()[1] else values[i+1].x
                                width = Math.min((mid-left), (right-mid)) * bar_ratio
                                if width >= 0 then width else 0
                        else (d,i)=>
                                mid = @h @x(d,i)
                                left = @h if !i then (@chart.orig_h ? @h).domain()[0] else @x(@current_data[i-1],i-1)
                                right = @h if i==@current_data.length-1 then (@chart.orig_h ? @h).domain()[1] else @x(@current_data[i+1],i+1)
                                width = Math.min((mid-left), (right-mid)) * bar_ratio
                                if width >= 0 then width else 0
                        bar_shift = -> bar_width(arguments...) / 2
                else throw "Invalid bar_width "+@bar_width

        if @stacks?
            x = (d,i,j)=> @h( @stacks[j].values[i].x )
            y = (d,i,j)=> @v( @stacks[j].values[i].y0 + @stacks[j].values[i].y )
            height = (d,i,j)=> baseline - (@v @stacks[j].values[i].y)
        else
            x = (d,i)=> @h @x(d,i)
            y = (d,i)=> y=@y(d,i); if y>0 then @v(y) else baseline
            height = (d,i)=> Math.abs( baseline - (@v @y(d,i)) )

        @rects.animate(origin is 'redraw').position
            x: if not bar_shift then x
            else if typeof bar_shift isnt 'function' then -> x(arguments...) - bar_shift
            else -> x(arguments...) - bar_shift(arguments...)
            y: y
            height: height
            width: bar_width

    _style: (style_new)=>
        super
        @rects.style(style_new)


###################################################################
# XY Plot Straight Line Layers
###################################################################

# Straight **horizontal** or **vertical** line layer for the
# {c3.Plot XY Plot Chart}.  This is an **abstract** layer, please instantiate a
# {c3.Plot.Layer.Line.Horizontal} or {c3.Plot.Layer.Line.Vertical}
# directly.
#
# A seperate line is drawn for each data element in the `data` array.
# _Set `label_options.text` to define a **label** for each line._
# Straight line layers are not _{c3.Plot.Layer.Stackable stackable}_.
#
# ## Extensibility
# The following {c3.Selection} members are made available if appropriate:
# * **vectors**
# * **lines**
# * **labels**
#
# ## Events
# * **dragstart**
# * **drag**
# * **dragend**
#
# @abstract
# @author Douglas Armstrong
class c3.Plot.Layer.Line.Straight extends c3.Plot.Layer
    @version: 0.1
    type: 'straight'

    # [Function] Optional accessor to identify data elements when changing the dataset
    key: undefined
    # [Function] Accessor to get the value for each data element.
    # _Defaults to the identity function._
    value: undefined
    # [Function] Accessor to determine if data elements are filtered in or not.
    filter: undefined
    # [Boolean] Enable lines to be draggable.
    # The drag event callbacks can be used to adjust the original data values
    draggable: false
    # [{c3.Selection.Options}] Options for the svg:g of the vector group nodes.
    # There is one node per data element.  Use this option for animating line movement.
    vector_options: undefined
    # [{c3.Selection.Options}] Options for the svg:line lines.
    line_options: undefined
    # [{c3.Selection.Options}] Options for the svg:line lines for hidden lines
    # behind each line that is wider and easier for users to interact with
    # e.g. for click or drag events.
    grab_line_options: undefined
    # [{c3.Selection.Options}] Define this to render labels.  Options for the svg:text labels.
    # This option also takes the following additional properties:
    # * **alignment** - [String] Alignment of label.
    # * * `left` or `right` for horizontal lines
    # * * `top` or `bottom` for vertical lines
    # * **dx** - [String] Relative placement for the label
    # * **dy** - [String] Relative placement for the label
    label_options: undefined

    _init: =>
        @value ?= (d)-> d

        # Draggable lines
        if @draggable
            # NOTE: Because vertical lines are rotated, we are always dragging `y`
            self = this
            @dragger = d3.behavior.drag()
            drag_value = undefined
            #drag.origin (d,i)=> { y: @scale @value(d,i) }
            @dragger.on 'dragstart', (d,i)=>
                d3.event.sourceEvent.stopPropagation() # Prevent panning in zoomable charts
                @trigger 'dragstart', d, i
            @dragger.on 'drag', (d,i)->
                domain = (self.chart.orig_h ? self.scale).domain()
                drag_value = Math.min(Math.max(self.scale.invert(d3.event.y), domain[0]), domain[1])
                d3.select(this).attr 'transform', 'translate(0,'+self.scale(drag_value)+')'
                self.trigger 'drag', drag_value, d, i
            @dragger.on 'dragend', (d,i)=>
                @trigger 'dragend', drag_value, d, i

    _size: =>
        @lines?.all?.attr 'x2', @line_length
        @grab_lines?.all?.attr 'x2', @line_length
        @labels?.all?.attr 'x', if @label_options.alignment is 'right' or @label_options.alignment is 'top' then @width else 0

    _update: (origin)=>
        @current_data = if @filter? then (d for d,i in @data when @filter(d,i)) else @data

        @vectors = @content.select('g.vector').options(@vector_options).animate(origin is 'redraw')
            .bind(@current_data, @key).update()
        @lines = @vectors.inherit('line').options(@line_options).update()

        if @label_options?
            @label_options.dx ?= '0.25em'
            @label_options.dy ?= '-0.25em'
            @labels = @vectors.inherit('text').options(@label_options).update()

        # Add extra width for grabbable line area
        if @draggable or @grab_line_options
            @grab_lines = @vectors.inherit('line.grab')
            if @grab_line_options then @grab_lines.options(@grab_line_options).update()

        if @draggable
            @vectors.new.call @dragger

    _draw: (origin)=>
        @vectors.animate(origin is 'redraw').position
            transform: (d,i)=> 'translate(0,' + (@scale @value(d,i)) + ')'

        @lines.new.attr 'x2', @line_length
        @grab_lines?.new.attr 'x2', @line_length

        if @labels?
            far_labels = @label_options.alignment is 'right' or @label_options.alignment is 'top'
            @g.style 'text-anchor', if far_labels then 'end' else 'start'
            @labels.position
                dx: if far_labels then '-'+@label_options.dx else @label_options.dx
                dy: @label_options.dy
                x: if far_labels then @line_length else 0

    _style: (style_new)=>
        @g.classed 'draggable', @draggable
        @vectors.style(style_new)
        @lines.style(style_new)
        @grab_lines?.style?(style_new)
        @labels?.style?(style_new)

# Horizontal line layer.  Please refer to {c3.Plot.Layer.Line.Straight} for documentation.
# @see c3.Plot.Layer.Line.Straight
class c3.Plot.Layer.Line.Horizontal extends c3.Plot.Layer.Line.Straight
    type: 'horizontal'

    _init: =>
        label_options?.alignment ?= 'left'
        super
        @scale = @v

    _size: =>
        @line_length = @width
        super

# Vertical line layer.  Please refer to {c3.Plot.Layer.Line.Straight} for documentation.
# @see c3.Plot.Layer.Line.Straight
class c3.Plot.Layer.Line.Vertical extends c3.Plot.Layer.Line.Straight
    type: 'vertical'

    _init: =>
        label_options?.alignment ?= 'top'
        super
        @scale = @h

    _size: =>
        @g.attr
            transform: 'rotate(-90) translate('+-@height+',0)'
        @line_length = @height
        super


###################################################################
# XY Plot Region Layers
###################################################################

# Render a rectangular region in an {c3.Plot XY Plot Chart}.
#
# Define `x` and `x2` options for vertical regions,
# `y` and `y2` for horizontal regions, or all four for rectangular regions.
#
# The regions may be enabled to be `draggable` and/or `resizable`.
# The chart will move or resize the region interactively, however it is up to
# the user code to modify the data elements based on the `drag` or `dragend`
# events.  These callbacks are called with a structure of the new values and
# the data element as parameters.  The structure of new values is an object
# with `x`, `x2` and `y`, `y2` members.
#
# ## Extensibility
# The following {c3.Selection} members are made available if appropriate:
# * **regions**
# * **rects**
#
# ## Events
# * **dragstart** - called with the data element.
# * **drag** - called with the new position and the data element.
# * **dragend** - called with the new position and the data element.
#
# @author Douglas Armstrong
class c3.Plot.Layer.Region extends c3.Plot.Layer
    type: 'region'

    _init: =>
        if (@x? and !@x2?) or (!@x? and @x2?) or (@y? and !@y2?) or (!@y? and @y2?)
            throw Error "x and x2 options or y and y2 options must either be both defined or undefined"

        # Draggable lines
        if @draggable or @resizable
            drag_value = undefined
            origin = undefined
            self = this
            @dragger = d3.behavior.drag()
                .origin (d,i)=>
                    x: if @x? then @h @x d,i else 0
                    y: if @y? then @v @y d,i else 0
                .on 'drag', (d,i)->
                    h_domain = (self.orig_h ? self.h).domain()
                    v_domain = self.v.domain()
                    if self.x?
                        width = self.x2(d) - self.x(d)
                        x = Math.min(Math.max(self.h.invert(d3.event.x), h_domain[0]), h_domain[1]-width)
                    if self.y?
                        height = self.y2(d) - self.y(d)
                        y = Math.min(Math.max(self.v.invert(d3.event.y), v_domain[0]), v_domain[1]-height)
                    # Run values through scale round-trip in case it is a time scale.
                    drag_value =
                        x: if x? then self.h.invert self.h x
                        x2: if x? then self.h.invert self.h x + width
                        y: if y? then self.v.invert self.v y
                        y2: if y? then self.v.invert self.v y + height
                    if self.x? then d3.select(this).attr 'x', self.h drag_value.x
                    if self.y? then d3.select(this).attr 'y', self.v drag_value.y2
                    self.trigger 'drag', drag_value, d, i

            @left_resizer = d3.behavior.drag()
                .origin (d,i)=>
                    x: @h @x d, i
                .on 'drag', (d,i)->
                    h_domain = (self.orig_h ? self.h).domain()
                    x = Math.min(Math.max(self.h.invert(d3.event.x), h_domain[0]), h_domain[1])
                    x2 = self.x2 d
                    drag_value =
                        x: self.h.invert self.h Math.min(x, x2)
                        x2: self.h.invert self.h Math.max(x, x2)
                        y: if self.y? then self.y(d)
                        y2: if self.y2? then self.y2(d)
                    d3.select(this.parentNode).select('rect').attr
                        x: self.h drag_value.x
                        width: self.h(drag_value.x2) - self.h(drag_value.x)
                    self.trigger 'drag', drag_value, d, i

            @right_resizer = d3.behavior.drag()
                .origin (d,i)=>
                    x: @h @x2 d, i
                .on 'drag', (d,i)->
                    h_domain = (self.orig_h ? self.h).domain()
                    x = Math.min(Math.max(self.h.invert(d3.event.x), h_domain[0]), h_domain[1])
                    x2 = self.x d
                    drag_value =
                        x: self.h.invert self.h Math.min(x, x2)
                        x2: self.h.invert self.h Math.max(x, x2)
                        y: if self.y? then self.y(d)
                        y2: if self.y2? then self.y2(d)
                    d3.select(this.parentNode).select('rect').attr
                        x: self.h drag_value.x
                        width: self.h(drag_value.x2) - self.h(drag_value.x)
                    self.trigger 'drag', drag_value, d, i

            @top_resizer = d3.behavior.drag()
                .origin (d,i)=>
                    y: @v @y2 d, i
                .on 'drag', (d,i)->
                    v_domain = self.v.domain()
                    y = Math.min(Math.max(self.v.invert(d3.event.y), v_domain[0]), v_domain[1])
                    y2 = self.y d
                    drag_value =
                        x: if self.x? then self.x(d)
                        x2: if self.x2? then self.x2(d)
                        y: self.v.invert self.v Math.min(y, y2)
                        y2: self.v.invert self.v Math.max(y, y2)
                    d3.select(this.parentNode).select('rect').attr
                        y: self.v drag_value.y2
                        height: self.v(drag_value.y) - self.v(drag_value.y2)
                    self.trigger 'drag', drag_value, d, i

            @bottom_resizer = d3.behavior.drag()
                .origin (d,i)=>
                    y: @v @y d, i
                .on 'drag', (d,i)->
                    v_domain = self.v.domain()
                    y = Math.min(Math.max(self.v.invert(d3.event.y), v_domain[0]), v_domain[1])
                    y2 = self.y2 d
                    drag_value =
                        x: if self.x? then self.x(d)
                        x2: if self.x2? then self.x2(d)
                        y: self.v.invert self.v Math.min(y, y2)
                        y2: self.v.invert self.v Math.max(y, y2)
                    d3.select(this.parentNode).select('rect').attr
                        y: self.v drag_value.y2
                        height: self.v(drag_value.y) - self.v(drag_value.y2)
                    self.trigger 'drag', drag_value, d, i

            for dragger in [@dragger, @left_resizer, @right_resizer, @top_resizer, @bottom_resizer]
                dragger
                    .on 'dragstart', (d,i)=>
                        d3.event.sourceEvent.stopPropagation() # Prevent panning in zoomable charts
                        @trigger 'dragstart', d, i
                    .on 'dragend', (d,i)=>
                        @trigger 'dragend', drag_value, d, i
                        @_draw() # reposition the grab lines for the moved region

    _size: =>
        if not @x?
            @rects?.all.attr 'width', @width
            @left_grab_lines?.all.attr 'width', @width
            @right_grab_lines?.all.attr 'width', @width
        if not @y?
            @rects?.all.attr 'height', @height
            @top_grab_lines?.all.attr 'height', @height
            @bottom_grab_lines?.all.attr 'height', @height

    _update: (origin)=>
        @current_data = if @filter? then (d for d,i in @data when @filter(d,i)) else @data

        @regions = @content.select('g.region').options(@region_options).animate(origin is 'redraw')
            .bind(@current_data, @key).update()
        @rects = @regions.inherit('rect').options(@rect_options).update()

        if @draggable
            @rects.new.call @dragger

        # Add extra lines for resizing regions
        if @resizable
            if @x?
                @left_grab_lines = @regions.inherit('line.grab.left')
                @left_grab_lines.new.call @left_resizer
            if @x2?
                @right_grab_lines = @regions.inherit('line.grab.right')
                @right_grab_lines.new.call @right_resizer
            if @y?
                @top_grab_lines = @regions.inherit('line.grab.top')
                @top_grab_lines.new.call @top_resizer
            if @y2?
                @bottom_grab_lines = @regions.inherit('line.grab.bottom')
                @bottom_grab_lines.new.call @bottom_resizer

    _draw: (origin)=>
        @rects.animate(origin is 'redraw').position
            x: (d)=> if @x? then @h @x d else 0
            width: (d)=> if @x2? then @h(@x2(d))-@h(@x(d)) else @width
            y: (d)=> if @y2? then @v @y2 d else 0
            height: (d)=> if @y? then @v(@y(d))-@v(@y2(d)) else @height

        if @resizable
            @left_grab_lines?.animate(origin is 'redraw').position
                x1: (d)=> @h @x d
                x2: (d)=> @h @x d
                y1: (d)=> if @y? then @v @y d else 0
                y2: (d)=> if @y2? then @v @y2 d else @height
            @right_grab_lines?.animate(origin is 'redraw').position
                x1: (d)=> @h @x2 d
                x2: (d)=> @h @x2 d
                y1: (d)=> if @y? then @v @y d else 0
                y2: (d)=> if @y2? then @v @y2 d else @height
            @top_grab_lines?.animate(origin is 'redraw').position
                x1: (d)=> if @x? then @h @x d else 0
                x2: (d)=> if @x2? then @h @x2 d else @width
                y1: (d)=> @v @y2 d
                y2: (d)=> @v @y2 d
            @bottom_grab_lines?.animate(origin is 'redraw').position
                x1: (d)=> if @x? then @h @x d else 0
                x2: (d)=> if @x2? then @h @x2 d else @width
                y1: (d)=> @v @y d
                y2: (d)=> @v @y d

    _style: (style_new)=>
        @g.classed
            'draggable': @draggable
            'horizontal': not @x?
            'vertical': not @y?
        @regions.style style_new
        @rects.style style_new


###################################################################
# XY Plot Scatter Layer
###################################################################

# Scatter plot layer for the {c3.Plot XY Plot Chart}
#
# Datapoints include a circle and an optional label.
# _Set `label_options.text` to define the label for each point._
#
# ## Extensibility
# The following {c3.Selection} members are made available if appropriate:
# * **points** - Representing svg:g nodes for each datapoint
# * **circles** - Representing svg:circle nodes for each datapoint
# * **labels** - Representing svg:text labels for each datapoint
# @author Douglas Armstrong
# @todo Only render datapoints within the current zoomed domain.
class c3.Plot.Layer.Scatter extends c3.Plot.Layer
    @version: 0.1
    type: 'scatter'

    # [Function] Accessor function to define a unique key to each data point.  This has performance implications.
    # _This is required to enable **animations**._
    key: undefined
    # [Function, Number] Accessor or value to set the value for each data point.
    #   This is used when limiting the number of elements.
    value: undefined
    # [Function, Number] Accessor or value to set the circle radius
    r: 1
    # [Function, Number] Accessor or value to set the circle area. _Takes precedence over r._
    a: undefined
    # [Boolean] Safe mode will not render data where a positioning accessor returns undefined.
    # _This may cause the index passed to accessors to not match the original data array._
    safe: true
    # [Function] Accessor to determine if the data point should be drawn or not
    # _This may cause the index passed to accessors to not match the original data array._
    filter: undefined
    # [Number] Limit the number of data points.
    # _This may cause the index passed to accessors to not match the original data array._
    limit_elements: undefined
    # [{c3.Selection.Options}] Options for svg:g nodes for each datapoint.
    point_options: undefined
    # [{c3.Selection.Options}] Options for the svg:circle of each datapoint
    circle_options: undefined
    # [{c3.Selection.Options}] Options for the svg:text lables of each datapoint.
    label_options: undefined

    _init: =>
        if not @x? then throw Error "x must be defined for a scatter plot layer"
        if not @y? then throw Error "y must be defined for a scatter plot layer"
        if not @h? then throw Error "h must be defined for a scatter plot layer"
        if not @v? then throw Error "v must be defined for a scatter plot layer"

    _update: (origin)=>
        if not @data then throw Error "Data must be defined for scatter layer."

        # Filter the data for safety
        @current_data = if @filter? and @key? then (d for d,i in @data when @filter(d,i)) else @data
        if @safe then @current_data = (d for d in @current_data when (
            @x(d)? and @y(d)? and (!@a? or typeof @a!='function' or @a(d)?) and (typeof @r!='function' or @r(d)?) ))

        # Limit the number of elements?
        if @limit_elements?
            if @value?
                @current_data = @current_data[..] # Copy the array to avoid messing up the user's order
                c3.array.sort_up @current_data, (d)=> -@value(d) # Sort by negative to avoid reversing array
                @current_data = @current_data[..@limit_elements]
            else @current_data = @current_data[..@limit_elements]

        # Bind and create the elements
        @points = @content.select('g.point').options(@point_options).animate(origin is 'redraw')
            .bind(@current_data, @key).update()

        # If there is no key, then hide the elements that are filtered
        if @filter? and not @key?
            @points.all.attr 'display', (d,i)=> if not @filter(d,i) then 'none'

        # Add circles to the data points
        @circles = @points.inherit('circle').options(@circle_options).animate(origin is 'redraw').update()

        # Add labels to the data points
        if @label_options?
            @labels = @points.inherit('text').options(@label_options).update()

    _draw: (origin)=>
        @points.animate(origin is 'redraw').position
            transform: (d,i)=> 'translate('+(@h @x(d,i))+','+(@v @y(d,i))+')'

        @circles.animate(origin is 'redraw').position
            r: if not @a? then @r else
                if typeof @a is 'function' then (d,i)=> Math.sqrt( @a(d,i) / Math.PI )
                else Math.sqrt( @a / Math.PI )

    _style: (style_new)=>
        @points.style(style_new)
        @circles.style(style_new)
        @labels?.style(style_new)


###################################################################
# XY Plot Swimlane Layers
###################################################################

# Base abstract class for {c3.Plot XY Plot} {c3.Plot.Layer layers} with horizontal swim lanes.
# Swimlanes are numbered based on the vertical scale domain for the layer.
# The first entry in the domain is the top swimlane and the last entry is the bottom swimlane plus 1.
# If the first and last domain values are equal, then there are no swimlanes rendered.
#
# ## Extensibility
# The following {c3.Selection} members are made available if appropriate:
# * **lanes** - svg:rect's for each swimlane
# * **tip** - HTML hover content
# @abstract
# @author Douglas Armstrong
class c3.Plot.Layer.Swimlane extends c3.Plot.Layer
    type: 'swimlane'

    # [String] `top` for 0 to be at the top, `bottom` for the bottom.
    # Swimlanes default to 0 at the top.
    v_orient: 'top'
    # [Number] Height of a swimlane in pixels.
    # Chart height will be adjusted if number of swimlanes changes in a redraw()
    dy: undefined
    # [Function] Provide HTML content for a hover div when mousing over the layer
    # This callback will be called with the datum and index of the item being hovered over.
    # It will be called with null when hovering over the layer but not any data items.
    hover: undefined
    # [{c3.Selection.Options}] Options for the lane svg:rect nodes for swimlanes
    lane_options: undefined

    _init: =>
        if @lane_options? then @lanes = @content.select('rect.lane',':first-child').options(@lane_options)

        # Support html hover tooltips
        if @hover?
            anchor = d3.select(@chart.anchor)
            @tip = c3.select( anchor, 'div.c3.hover' ).singleton()
            layer = this
            mousemove = ->
                [layerX,layerY] = d3.mouse(this)
                # Get swimlane and ensure it is properly in range (mouse may be over last pixel)
                swimlane = Math.floor layer.v.invert layerY
                swimlane = Math.min swimlane, Math.max layer.v.domain()[0], layer.v.domain()[1]-1
                x = layer.h.invert layerX

                hover_datum = layer._hover_datum(x, swimlane)
                hover_html = (c3.functor layer.hover)(
                  hover_datum,
                  (if hover_datum then layer.data.indexOf(hover_datum) else null),
                  swimlane
                )
                if not hover_html
                    layer.tip.all.style 'display', 'none'
                else
                    layer.tip.all.html hover_html
                    elt = layer.tip.all.node()
                    x = d3.event.clientX
                    y = d3.event.clientY

                    if x + elt.clientWidth > document.body.clientWidth
                        x = document.body.clientWidth - elt.clientWidth

                    layer.tip.all.style
                        display: 'block'
                        left: x+'px'
                        top: y+'px'

            # Set for vertical panning
            @chart.v_orient = @v_orient

            # Manage tooltip event handlers, disable while zooming/panning
            @chart.content.all.on 'mouseleave.hover', => layer.tip.all.style 'display', 'none'
            @chart.content.all.on 'mousedown.hover', =>
                layer.tip.all.style 'display', 'none'
                @chart.content.all.on 'mousemove.hover', null
            @chart.content.all.on 'mouseup.hover', => @chart.content.all.on 'mousemove.hover', mousemove
            @chart.content.all.on 'mouseenter.hover', => if !d3.event.buttons then @chart.content.all.on 'mousemove.hover', mousemove
            @chart.content.all.on 'mousemove.hover', mousemove

    _size: =>
        # If @dy is not defined, we determine it based on the chart height
        if not @y? then @dy = @height
        else @dy ?= Math.round @height / (Math.abs(@v.domain()[1]-@v.domain()[0]))

        # If a swimlane starts at the bottom, then shift up by dy because SVG always
        # renders the height of element downward.
        @g.attr 'transform', if @v_orient is 'bottom' then 'translate(0,-'+@dy+')' else ''

    _update: =>
        # Support constant values and accessors
        @x = c3.functor @x
        @dx = c3.functor @dx

        @lanes?.bind([@v.domain()[0]...@v.domain()[1]]).update()

        # Update chart height to fit current number of swimlanes based on current v domain
        if @y? then @chart.size null, @dy*(Math.abs(@v.domain()[1]-@v.domain()[0])) + @chart.margins.top + @chart.margins.bottom

    _draw: (origin)=>
        if origin is 'resize' or origin is 'render'
            @lanes?.position
                y: (lane)=> @v lane
                width: @chart.orig_h.range()[1]
                height: @dy

    _style: =>
        @lanes?.style()


###################################################################
# XY Plot Segment Swimlane Layer
###################################################################

# A {c3.Plot.Layer.Swimlane swimlane layer} for drawing horizontal segments in each swimlane.
#
# _Set `label_options.text` to define labels for the segments._
# The following {c3.Selection} members are made available if appropriate:
# ## Extensibility
# The following {c3.Selection} members are made available if appropriate:
# * **rects** - svg:rect for each segment
# @todo Better threshold for determining which segments get labels.  _Currently it is any segment > 50 pixels wide._
# @author Douglas Armstrong
class c3.Plot.Layer.Swimlane.Segment extends c3.Plot.Layer.Swimlane
    @version: 0.1
    type: 'segment'

    # **REQUIRED** [Function] Accessor to get the width of the segment
    dx: null
    # [Function] Key accessor to uniquely identify the segment.
    #   Defining this improves performance for redraws.
    key: undefined
    # [Function] Accessor to determine if an element should be rendered
    filter: undefined
    # [Function] Value accessor for each segment.  Used when limiting the number of elements.  _Defaults to dx._
    value: undefined
    # [Number] Specifies the maximum number of segments this layer will draw.  Smaller segments are elided first.
    limit_elements: undefined
    # [{c3.Selection.Options}] Options for the svg:rect nodes for each segment
    rect_options: undefined
    # [{c3.Selection.Options}] Options for the label svg:text nodes for each segment
    label_options: undefined

    # IE10/11 doesn't support vector-effects: non-scaling-stroke, so avoid using scaled SVG.
    # This is a performance hit, because then we have to adjust the position of all rects for each redraw
    # TODO: Investigate if they added support for this in Edge.
    #scaled = !window.navigator.userAgent.match(/MSIE|Trident/) # MSIE==IE10, Trident==IE11, Edge==Edge
    # [3/18/2016] Disable the SVG scaled layer optimization completely for now.
    # If there are very large domains (e.g. a billion) then there is a floating-point precision problem
    # relying on SVG transformations to do the scaling/translation.
    # This doesn't seem to be a problem if we do the scaling ourselves in JavaScript.
    scaled = false

    _init: =>
        super
        @g.classed 'segment', true # Manually do this so inherited types also have this class
        if scaled then @scaled_g = @g.append('g').attr('class','scaled')
        @rects_group = c3.select((@scaled_g ? @g),'g.segments').singleton()
        if @label_options? then @labels_clip = c3.select(@g,'g.labels').singleton().select('svg')

    _hover_datum: (x, swimlane)=>
        right = @h.invert @h(x)+1 # Get the pixel width
        for datum,idx in @current_data
            if (!@y? or @y(datum)==swimlane) and (_x=@x(datum)) <= right and x <= _x+@dx(datum) then break
        return if idx==@current_data.length then null else datum

    _update: =>
        super
        # Pull filtered data elements
        @current_data = if not @filter? then @data else (d for d,i in @data when @filter(d,i))

        # Pre-sort data by "value" for limiting to the most important elements
        if @limit_elements?
            if not @filter? then @current_data = @current_data[..]
            c3.array.sort_down @current_data, (@value ? @dx)

    _draw: (origin)=>
        super

        # Gather data for the current viewport domain
        [left_edge, right_edge] = @h.domain()
        half_pixel_width = (right_edge-left_edge) / ((@h.range()[1]-@h.range()[0]) || 1) / 2
        data = []
        for datum in @current_data when (x=@x(datum)) < right_edge and (x+(dx=@dx(datum))) > left_edge
            if dx < half_pixel_width
                if @limit_elements? then break else continue
            data.push datum
            if data.length == @limit_elements then break

        # Bind here because the current data set is dynamic based on zooming
        @rects = @rects_group.select('rect.segment').options(@rect_options).bind(data, @key).update()

        # Get the vertical scale based on any possible vertical panning from a zoomable chart
        if origin=='pan'
            translate = (@chart.v.domain()[0] - @chart.orig_v.domain()[0]) * @max_depth # Assume V scale is 0-1
            @v.domain [translate, translate+@max_depth]

        # Position the rects
        h = if @scaled_g? then (@chart.orig_h ? @h) else @h
        zero_pos = h(0)
        (if origin is 'resize' then @rects.all else @rects.new).attr 'height', @dy
        (if !scaled or !@key? or origin=='resize' or origin=='pan' or (origin=='redraw' and this instanceof c3.Plot.Layer.Swimlane.Flamechart)
        then @rects.all else @rects.new).attr
            x: (d)=> h @x(d)
            width: (d)=> (h @dx(d)) - zero_pos
            y: if not @y? then 0 else (d)=> @v @y(d)

        # Bind and render lables here (not in _update() since the set is dynamic based on zooming and resizing)
        if @label_options?
            # Create labels in a nested SVG node so we can crop them based on the segment size.
            zero_pos = @h(0)
            current_labels = (datum for datum in data when (@h @dx datum)-zero_pos>50)
            @labels_clip.bind(current_labels, @key)
            @labels = @labels_clip.inherit('text').options(@label_options).update()

            (if origin is 'resize' then @labels_clip.all else @labels_clip.new).attr 'height', @dy
            @labels_clip.position
                x: (d)=> @h @x(d)
                y: if not @y? then 0 else (d,i)=> @v @y(d,i)
                width: (d)=> (@h @dx(d)) - zero_pos
            self = this
            (if origin is 'resize' then @labels.all else @labels.new).attr 'y', self.dy/2
            @labels.position
                x: (d)->
                    x = self.x(d)
                    dx = self.dx(d)
                    left = Math.max x, self.h.domain()[0]
                    right = Math.min x+dx, self.h.domain()[1]
                    return self.h( (right-left)/2 + (left-x) ) - zero_pos
#                x: (d)->
#                    x = self.x(d)
#                    dx = self.dx(d)
#                    left = Math.max x, self.h.domain()[0]
#                    right = Math.min x+dx, self.h.domain()[1]
#                    # NOTE: This is expensive.  Chrome was faster with offsetWidth, but Firefox and IE11 didn't support it
#                    text_width = this.offsetWidth ? this.getBBox().width
#                    if self.h(right-left)-zero_pos > text_width
#                        return self.h( (right-left)/2 + (left-x) ) - zero_pos - (text_width/2)
#                    else
#                        return if x < left then self.h(left-x)-zero_pos+1 else 1
        else
            c3.select(@g,'g.labels').all.remove()
            delete @labels

        # Style any new elements we added by resizing larger that allowed new relevant elements to be drawn
        if origin is 'resize' and (not @rects.new.empty() or (@labels? and not @labels.new.empty()))
            @_style true

    _style: (style_new)=>
        super
        @rects.style(style_new)
        @labels?.style(style_new)


###################################################################
# Flamechart
###################################################################

# A {c3.Plot.Layer.Swimlane swimlane layer} for rendering _flamecharts_ or _flamegraphs_.
#
# In C3, both a {c3.Plot.Layer.Swimlane.Flamechart Flamechart} and an
# {c3.Plot.Layer.Swimlane.Icicle Icicle} can actually grow either up or down
# depending if you set `v_orient` as `top` or `bottom`.
# A _Flamechart_ defaults to growing up and an _Icicle_ defaults to growing down.
# In C3, a {c3.Plot.Layer.Swimlane.Flamechart Flamechart} visualizes a timeline
# of instances of nested events over time, while an {c3.Plot.Layer.Swimlane.Icicle Icicle}
# visualizes an aggregated tree hierarchy of nodes.  The {c3.Polar.Layer.Sunburst Sunburst}
# is the equivalent of an _Icicle_ rendered on a polar axis.
#
# A `key()` is required for this layer.
# You should not define `y`, but you must define a `x`, `dx`, and `dy`.
#
# @author Douglas Armstrong
class c3.Plot.Layer.Swimlane.Flamechart extends c3.Plot.Layer.Swimlane.Segment
    @version: 0.1
    type: 'flamechart'

    # [String] `top` for 0 to be at the top, `bottom` for the bottom.
    # Flamechart defaults to bottom-up.
    v_orient: 'bottom'

    _init: =>
        super
        if not @key? then throw Error "`key()` accessor function is required for Flamechart layers"
        if not @dy? then throw Error "`dy` option is required for Flamechart layers"
        if @y? then throw Error "`y` option cannot be defined for Flamechart layers"
        @y = (d)=> @depths[@key d]
        @depths = {}

    _update: (origin)=>
        super

        # Compute depths for each data element
        data = @current_data[..]
        c3.array.sort_up data, @x
        max_depth = 0
        stack = []
        for datum in data
            frame =
                x: @x datum
                dx: @dx datum
            while stack.length and frame.x >= (_frame=stack[stack.length-1]).x + _frame.dx
                stack.length--
            stack.push frame
            max_depth = Math.max max_depth, stack.length # stack.length is starting from 0, so don't reduce by one.
            @depths[@key datum] = stack.length - 1

        # Set the vertical domain and resize chart based on maximum flamechart depth
        @v.domain [0, max_depth]
        # Set max depth here because at some point the v.domain gets reset to something incorrect in the initialization
        # and we need this value for panning
        @max_depth = max_depth
        c3.Plot.Layer.Swimlane::_update.call this, origin


###################################################################
# Icicle
###################################################################

# A {c3.Plot.Layer.Swimlane swimlane layer} for rendering _icicle_ charts.
#
# In C3, both a {c3.Plot.Layer.Swimlane.Flamechart Flamechart} and an
# {c3.Plot.Layer.Swimlane.Icicle Icicle} can actually grow either up or down
# depending if you set `v_orient` as `top` or `bottom`.
# A _Flamechart_ defaults to growing up and an _Icicle_ defaults to growing down.
# In C3, a {c3.Plot.Layer.Swimlane.Flamechart Flamechart} visualizes a timeline
# of instances of nested events over time, while an {c3.Plot.Layer.Swimlane.Icicle Icicle}
# visualizes an aggregated tree hierarchy of nodes.  The {c3.Polar.Layer.Sunburst Sunburst}
# is the equivalent of an _Icicle_ rendered on a polar axis.
#
# A `key()` is required for this layer.
# You should not define `x` or `y`, but you must define `dy`.
# Specify a callback for either `parent_key`,
# `children`, or `children_keys` to describe the hierarchy.
# If using `parent_key` or `children_keys` the `data` array shoud include all nodes,
# if using `children` it only should include the root nodes.
# Define either `value()` or `self_value()` to value the nodes in the hierarchy.
#
# If you care about performance, you can pass the
# parameter `revalue` to `redraw('revalue')` if you are keeping the same dataset
# hierarchy, and only changing the element's values.
# The Icicle layer can use a more optimized algorithm in this situation.
#
# ## Events
# * **rebase** Called with the datum of a node when it becomes the new root
#   or with `null` if reverting to the top of the hierarchy.
#
# @author Douglas Armstrong
class c3.Plot.Layer.Swimlane.Icicle extends c3.Plot.Layer.Swimlane
    @version: 0.1
    type: 'icicle'

    # **REQUIRED** [Function] Accessor function to define a unique key for each data element.
    # _This has performance implications and is required for some layers and **animations**._
    key: undefined

    # [Function] Accessor to get the "_total_" value of the data element.
    # That is the total value of the element itself inclusive of all of it's children's value.
    # You can define either _value_ or _self_value_.
    value: undefined
    # [Function] The `value` accessor defines the "_total_" value for an element, that is the value of
    # the element itself plus that of all of its children.  If you know the "self" value of an
    # element without the value of its children, then define this callback accessor instead.
    # The `value` option will then also be defined for you, which you can use to get the total value
    # of an element after the layer has been drawn.
    self_value: undefined

    # [Function] A callback that should return the key of the parent of an element.
    # It is called with a data element as the first parameter.
    parent_key: undefined
    # [Function] A callback that should return an array of child keys of an element.
    # The returned array may be empty or null.
    # It is called with a data element as the first parameter.
    children_keys: undefined
    # [Function] A callback that should return an array of children elements of an element.
    # The returned array may be empty or null.
    # It is called with a data element as the first parameter.
    children: undefined

    # [Boolean, Function] How to sort the partitioned tree segments.
    # `true` sorts based on _total_ value, or you can define an alternative
    # accessor function to be used for sorting.
    sort: false

    # [Number] Limit the number of data elements to render based on their value.
    # _This affects the callback index parameter_
    limit_elements: undefined
    # [Number] Don't bother rendering segments whose value is smaller than this
    # percentage of the current domain focus. (1==100%)
    limit_min_percent: 0.001

    # Data element that represents the root of the hierarchy to render.
    # If this is specified, then only this root and its parents and children will be rendered
    # When {c3.Plot.Layer.Icicle#rebase rebase()} is called or a node is clicked on
    # it will animate the transition to a new root node, if animation is enabled.
    root_datum: null

    # [Boolean] Set the root_datum on node click.
    # This will also zoom the Icicle to that root.
    set_root_on_click: true

    # [{c3.Selection.Options}] Options for the svg:rect nodes for each segment
    rect_options: undefined
    # [{c3.Selection.Options}] Options for the label svg:text nodes for each segment
    label_options: undefined

    _init: =>
        super
        if not @key? then throw Error "`key()` accessor function is required for Icicle layers"
        if not @dy? then throw Error "`dy` option is required for Icicle layers"
        if @x? then throw Error "`x` option cannot be defined for Icicle layers"
        if @y? then throw Error "`y` option cannot be defined for Icicle layers"
        @y = (datum)=> @nodes[@key datum].y1

        @segments_g = c3.select(@g, 'g.segments').singleton()

        @segment_options = { events: { click: (d)=>
            if @set_root_on_click
                @rebase if d isnt @root_datum then d
                else (if @parent_key? then @nodes[@parent_key d] else @nodes[@key d].parent)?.datum
        } }
        @label_clip_options = {}
        if @label_options?
            @label_options.animate ?= @rect_options.animate
            @label_options.duration ?= @rect_options.duration
            @label_clip_options.animate ?= @rect_options.animate
            @label_clip_options.duration ?= @rect_options.duration

    _hover_datum: (x, swimlane)=>
        right = @h.invert @h(x)+1 # Get the pixel width
        for key,node of @nodes
            if node.y1 is swimlane and node.x1 <= right and x <= node.x2
                return node.datum
        return null

    _update: (origin)=>
        super

        # Construct the tree hierarchy
        if origin isnt 'revalue' and origin isnt 'rebase'
            @tree = new c3.Layout.Tree
                key: @key,
                parent_key: @parent_key, children_keys: @children_keys, children: @children
                value: @value, self_value: @self_value
            @nodes = @tree.construct @data

            # Set the vertical domain and resize chart based on maximum flamechart depth
            @v.domain [0, d3.max Object.keys(@nodes), (key)=> @nodes[key].y2]
            c3.Plot.Layer.Swimlane::_update.call this, origin

        # Compute the "total value" of each node
        if origin isnt 'rebase'
            @value = @tree.revalue()

        # Partition the arc segments based on the node values
        # We need to do this even for 'rebase' in case we shot-circuited previous paritioning
        @current_data = @tree.layout(
            if origin isnt 'revalue' and origin isnt 'rebase' then @sort else false
            @limit_min_percent
            @root_datum
        )

        # Limit the number of elements to bind to the DOM
        if @current_data.length > @limit_elements
            c3.array.sort_up @current_data, @value # sort_up is more efficient than sort_down
            @current_data = @current_data[-@limit_elements..]

        # Bind data elements to the DOM
        @segment_options.animate = @rect_options?.animate
        @segment_options.animate_old = @rect_options?.animate
        @segment_options.duration = @rect_options?.duration
        @segments = @segments_g.select('g.segment').options(@segment_options)
            .animate(origin is 'redraw' or origin is 'revalue' or origin is 'rebase')
            .bind(@current_data, @key).update()
        @rect_options?.animate_old ?= @rect_options?.animate
        @rects = @segments.inherit('rect').options(@rect_options).update()
        if @label_options?
            @label_clip_options.animate_old = @label_options?.animate
            @label_clips = @segments.inherit('svg.label').options(@label_clip_options)

    _draw: (origin)=>
        super

        # Set the horizontal domain based on the root node.
        prev_h = @h.copy()
        prev_zero_pos = prev_h(0)
        root_node = @nodes[@key @root_datum] if @root_datum?
        @h.domain [root_node?.x1 ? 0, root_node?.x2 ? 1]
        zero_pos = @h(0)

        # Position the segments.
        # Place any new segments where they would have been if not decimated.
        (if origin is 'resize' then @rects.all else @rects.new).attr 'height', @dy
        @rects.animate(origin is 'redraw' or origin is 'revalue' or origin is 'rebase').position {
            x: (d)=> @h @nodes[@key d].x1
            y: (d)=> @v @nodes[@key d].y1
            width: (d)=> @h((node=@nodes[@key d]).x2 - node.x1) - zero_pos
          }, {
            x: (d)=> prev_h @nodes[@key d].px1
            y: (d)=> @v @nodes[@key d].py1
            width: (d)=> prev_h((node=@nodes[@key d]).px2 - node.px1) - prev_zero_pos
          }

        if @label_options?
            (if origin is 'resize' then @rects.all else @rects.new).attr 'height', @dy
            @label_clips.animate(origin is 'redraw' or origin is 'revalue' or origin is 'rebase').position {
                x: (d)=> @h @nodes[@key d].x1
                y: (d)=> @v @nodes[@key d].y1
                width: (d)=> @h((node=@nodes[@key d]).x2 - node.x1) - zero_pos
              }, {
                x: (d)=> prev_h @nodes[@key d].px1
                y: (d)=> @v @nodes[@key d].py1
                width: (d)=> prev_h((node=@nodes[@key d]).px2 - node.px1) - prev_zero_pos
              }

            # Bind and position labels for larger segments.
            @labels = c3.select(
                @label_clips.all.filter((d)=> @h((node=@nodes[@key d]).x2 - node.x1) - zero_pos >= 50)
            ).inherit('text', 'restore')
              .options(@label_options).update()
              .animate(origin is 'redraw' or origin is 'revalue' or origin is 'rebase').position
                y: @dy / 2
                x: (d)=>
                    node = @nodes[@key d]
                    left = Math.max node.x1, @h.domain()[0]
                    right = Math.min node.x2, @h.domain()[1]
                    return @h( (right-left)/2 + (left-node.x1) ) - zero_pos

            # Remove any stale labels from segments that are now too small
            @segments.all
                .filter((d)=> @h((node=@nodes[@key d]).x2 - node.x1) - zero_pos < 50)
                .selectAll('text')
                .transition('fade').duration(@label_options.duration).style('opacity',0)
                .remove()
        else
            @segments.all.selectAll('text').remove()
            delete @labels

        # Style any new elements we added by resizing larger that allowed new relevant elements to be drawn
        if origin is 'resize' and (not @rects.new.empty() or (@labels? and not @labels.new.empty()))
            @_style true

    _style: (style_new)=>
        super
        @rects.style(style_new)
        @labels?.style(style_new)

    # Navigate to a new root node in the hierarchy representing the `datum` element
    rebase: (@root_datum)=>
        @trigger 'rebase_start', @root_datum
        @chart.redraw 'rebase' # redraw all layers, since the scales will change
        @trigger 'rebase', @root_datum

    # Navigate to a new root node in the hierarchy represented by `key`
    rebase_key: (root_key)=> @rebase @nodes[root_key]?.datum


###################################################################
# XY Plot Sampled Swimlane Layers
###################################################################

# A {c3.Plot.Layer.Swimlane swimlane layer} that will sample for each pixel in each swimlane.
# @abstract
# @author Douglas Armstrong
class c3.Plot.Layer.Swimlane.Sampled extends c3.Plot.Layer.Swimlane
    @version: 0.0
    type: 'sampled'

    # **REQUIRED** [Function] Accessor to get the width of the segment
    dx: null
    # [Function] Callback to determine if the data element should be rendered or not
    filter: undefined
    # [Boolean] If safe mode is off then it is assumed the data is sorted by the x-axis
    safe: true

    _hover_datum: (x, swimlane)=>
        data = @swimlane_data[swimlane]
        right = @h.invert @h(x)+1 # Get the pixel width
        idx = d3.bisector(@x).right(data, x) - 1
        return if idx<0 then null
        else if x < @x(datum=data[idx])+@dx(datum) then datum
        else if ++idx<data.length and @x(datum=data[idx]) <= right then datum
        else null

    _update: =>
        super
        # Arrange data by swimlane and remove filtered items
        @swimlane_data = []
        @swimlane_data[swimlane] = [] for swimlane in [@v.domain()[0]...@v.domain()[1]]
        [top_edge, bottom_edge] = @v.domain()
        for datum, i in @data when (!@filter? or @filter(datum,i))
            swimlane = @y datum, i
            if top_edge <= swimlane < bottom_edge then @swimlane_data[swimlane].push datum

        # Sort data in safe mode
        if @safe
            c3.array.sort_up(data,@x) for data in @swimlane_data

    _sample: (sample)=>
        # Sample data points for each pixel in each swimlane
        bisector = d3.bisector(@x).right
        for swimlane in [@v.domain()[0]...@v.domain()[1]]
            v = @v swimlane
            data = @swimlane_data[swimlane]
            if not data.length then continue

            # Optimized to find the left starting point
            prev_idx = bisector(data, @h.domain()[0])
            if not prev_idx
                pixel = Math.round @h @x @data[prev_idx]
            else
                prev_idx--
                pixel = if @h(@x(@data[prev_idx])+@dx(@data[prev_idx])) > 0 then 0 else
                    Math.round @h @x data[prev_idx]

            # Iterate through each pixel in this swimlane
            while pixel < @width
                x = @h.invert(pixel)

                # Find the next data element for this pixel, or skip to the next pixel if there is a gap
                idx = prev_idx
                while idx < data.length
                    datum = data[idx]
                    prev_idx = idx
                    if (datum_x=@x(datum)) > x
                        pixel = Math.round @h datum_x
                        break
                    if x <= datum_x+@dx(datum) then break
                    idx++
                if idx==data.length then break

                sample pixel, v, datum
                pixel++
        return # avoid returning a comprehension


# A {c3.Plot.Layer.Swimlane.Sampled sampled swimlane layer} implemented via SVG lines
# ## Extensibility
# The following {c3.Selection} members are made available if appropriate:
# * **lines** - svg:rect's for each swimlane
# @todo Optimize by generating pixel data array once in _size() and reusing it in _draw()
class c3.Plot.Layer.Swimlane.Sampled.SVG extends c3.Plot.Layer.Swimlane.Sampled
    @version: 0.0
    type: 'svg'

    # [{c3.Selection.Options}] Options for the svg:line's in each swimlane
    line_options: undefined

    _draw: (origin)=>
        super

        # Gather sampled pixels to bind to SVG linex
        current_data = []
        pixels = []
        @_sample (x,y,datum)->
            current_data.push datum
            pixels.push { x:x, y:y }

        # Bind data in _draw without a key because it is based on pixel sampling
        @lines = c3.select(@g,'line').options(@line_options).bind(current_data).update()
        @lines.position
            x1: (d,i)-> pixels[i].x + 0.5 # Center line on pixels to avoid anti-aliasing
            x2: (d,i)-> pixels[i].x + 0.5
            y1: if not @y? then 0 else (d,i)-> pixels[i].y - 0.5
            y2: if not @y? then @height else (d,i)=> pixels[i].y + @dy - 0.5

    _style: =>
        super
        @lines.style()


# A {c3.Plot.Layer.Swimlane.Sampled sampled swimlane layer} implemented via HTML5 Canvas
# This layer supports `line_options.styles.stroke` and HTML `hover` "tooltips".
class c3.Plot.Layer.Swimlane.Sampled.Canvas extends c3.Plot.Layer.Swimlane.Sampled
    @version: 0.0
    type: 'canvas'

    # [{c3.Selection.Options}] Options for the svg:line's in each swimlane
    line_options: undefined

    _init: =>
        super
        foreignObject = c3.select(@g,'foreignObject').singleton().position({height:'100%',width:'100%'})
        @canvas = foreignObject.select('xhtml|canvas').singleton()
        #@canvas = document.createElement('canvas')
        #@image = c3.select(@g,'svg|image').singleton()

    _size: =>
        super
        @canvas.position
            height: @height
            width: @width

    __draw: =>
        context = @canvas.node().getContext('2d')
        context.clearRect 0,0, @width,@height

        # Translate by 0.5 so lines are centered on pixels to avoid anti-aliasing which causes transparency
        context.translate 0.5, 0.5

        # Sample pixels to render onto canvas
        stroke = c3.functor @line_options?.styles?.stroke
        @_sample (x,y,datum)=>
            context.beginPath()
            context.moveTo x, y
            context.lineTo x, y+@dy
            context.strokeStyle = stroke datum
            context.stroke()

        context.translate -0.5, -0.5

        #@image.all.attr('href',@canvas.toDataURL('image/png'))
        #@image.all.node().setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',@canvas.toDataURL('image/png'))

    _draw: (origin)=> super; @__draw(origin)

    _style: (style_new)=> super; if not style_new then @__draw('restyle')

    # For the sampled layer, draw and style are the same.  By default zoom does both, so just do one.
    zoom: => @__draw('zoom')


####################################################################
## XY Plot Decimated Layer
####################################################################
#
## A decimated layer may be created to assist certain layer types to manage large datasets.
## When using a decimated layer pass into the constructor an array of the data at different
## detail granularities as well as a layer object instance that will be used as a "prototype" to
## construct a different layer for each detail level of data.  This layer will only show one
## of the levels at a time and will automatically transition between them as the user zooms in and out.
##
## _When using a decimated layer, the **data** option does not need to be set for the layer prototype._
## @example Creating a decimated layer
##    mychart = new c3.Plot.horiz_zoom {
##       anchor: '#chart_div'
##       h: d3.scale.linear().domain [0, 1]
##       v: d3.scale.linear().domain [0, 100]
##       x: (d)-> d.x
##       layers: [
##           new c3.Layer.decimated mylevels, new c3.Layer.area {
##               y: (d)-> d.y
##               interpolate: 'basis'
##           }
##       ]
##    }
##    mychart.render()
## @todo Should this be implemented as a mix-in instead?
## @todo A built-in helper for users to construct decimated groups using CrossFilter
## @author Douglas Armstrong
#class c3.Plot.Layer.Decimated extends c3.Plot.Layer
#    @version: 0.1
#    type: 'decimated'
#
#    # [Number] The maximum number of data elements to render at a given time when preparing sections for smooth panning.
#    renderport_elements: 8000
#    # [Number] If a decimated element spans more than this number of pixels after zooming then switch to the next level of detail.
#    pixels_per_bucket_limit: 2
#
#    # @param levels [Array] An Array of detail levels.  Each entry in the array should be an array of data elements.
#    # Each level should also add a **granulairty** property which specified how many X domain units are combined into a single element for this level of detail.
#    # @param proto_layer [c3.Plot.Layer] A layer instance to use as a prototype to make layers for each level of detail.
#    constructor: (@levels, @proto_layer)->
##        @type += ' '+@proto_layer.type
#        for level, i in @levels
#            level.index = i
#            level.renderport = [0,0]
#
#    _init: =>
#        for level, i in @levels
#            level.layer = new @proto_layer.constructor()
#            c3.util.defaults level.layer, @proto_layer
#            level.layer.data = level
#            level.layer.g = @g.append('g').attr('class', 'level _'+i+' layer')
#            level.layer.init @chart
#
#    _size: =>
#        for level in @levels
#            level.layer.size @width, @height
#
#    _update: =>
#        # Invalidate the non-visible levels
#        for level in @levels when level isnt @current_level
#            level.renderport = [0,0]
#        @current_level?.layer.update()
#
#    _draw: =>
#        if not @current_level? then @zoom()
#        else @current_level.layer.draw()
#
#    zoom: =>
#        # Find the optimal decimation level for this viewport
#        view_width = @chart.h.domain()[1] - @chart.h.domain()[0]
#        for level in @levels
#            visible_buckets = view_width / level.granularity
#            if visible_buckets*@pixels_per_bucket_limit > @width
#                new_level = level
#                break
#        if !new_level? then new_level = @levels[@levels.length-1]
#
#        # Did we change decimation levels?
#        if @current_level != new_level
#            @current_level = new_level
#            @g.selectAll('g.level').style('display','none')
#            @g.select('g.level[class~=_'+@current_level.index+']').style('display',null)
#
#        # Determine if current viewport is outside current renderport and we need to redraw
#        if @chart.h.domain()[0] < @current_level.renderport[0] or
#           @chart.h.domain()[1] > @current_level.renderport[1]
#
#            # Limit number of elements to render, centered on the current viewport
#            center = (@chart.h.domain()[0]+@chart.h.domain()[1]) / 2
#            bisector = d3.bisector (d)->d.key
#            center_element = bisector.left @current_level, center
#            element_domain = []
#            element_domain[0] = center_element - @renderport_elements/2 - 1
#            element_domain[1] = center_element + @renderport_elements/2
#            if element_domain[0]<0 then element_domain[0] = 0
#            if element_domain[1]>@current_level.length-1 then element_domain[1] = @current_level.length-1
#
#            @current_level.renderport = (@current_level[i].key for i in element_domain)
#
#            # Swap data for the new renderport and redraw
#            @current_level.layer.data = @current_level[element_domain[0]..element_domain[1]]
#            @current_level.layer.redraw()
