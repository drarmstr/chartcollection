# C3 Visualization Library
# Polar Charts

###################################################################
# Polar Chart
###################################################################

# A chart that uses a polar coordinate system.
# `r` is the radial dimension and `t` is the angular dimension.
# The top is 0 degrees and the range is expressed in radians so a full circle is 0 to 2Pi.
# A polar chart can contain multiple {c3.Polar.Layer layers}.
# @author Douglas Armstrong
class c3.Polar extends c3.Chart
    @version: 0.1
    type: 'polar'
    # [Array<{c3.Polar.Layer}>] Array of {c3.Polar.Layer polar layers}
    layers: []
    # [Array] Default data array for layers in this polar chart.
    # _This can be set for each individual layer or a default for the entire chart._
    data: []
    # [{https://github.com/mbostock/d3/wiki/Scales d3.scale}] Scale for the _radial_ dimension.
    # Please set the _domain()_, c3 will set the _range()_.
    # _This can be set for each individual layer or a default for the entire chart._
    r: undefined
    # [{https://github.com/mbostock/d3/wiki/Scales d3.scale}] Scale for the _angular_ dimension.
    # Please set the _domain()_, c3 will set the _range()_.
    # _This can be set for each individual layer or a default for the entire chart._
    t: undefined
    # [Number] Angular range for the polar chart in radians.  0 is up and the direction is clockwise.
    # Defaults to the entire circle, which is [0, 2Pi].
    # Adjust this range to rotate the chart or use a semi-circle (e.g. [-Math.PI/2, Math.PI/2])
    angular_range: [0, 2*Math.PI]
    # [Boolean] Enable this polar chart to be zoomable with the mouse wheel or touch pinching gesture
    zoomable: false
    # [Array<number>] Array of minimum and maximum zoom scaling if zoomable is enabled
    zoom_extent: undefined
    # [{c3.Selection.Options}] Options to apply to each layer.  For callbacks, the first argument
    # is the layer object and the second argument is the index of the layer
    layer_options: undefined

    _init: =>
        # Set the default scales here instead of class-level so the defaults are still per-instance
        @r ?= d3.scale.linear()
        @t ?= d3.scale.linear()

        # Setup the Layers
        @layers_svg = @content.select('svg.layers',null,true).singleton()
        @layers_selection = @layers_svg.select('g.layer')
            .bind @layers, (layer)=>layer.uid
            .options @layer_options, (layer)->layer.options
        self = this
        @layers_selection.all.order()
        @layers_selection.new.each (layer)->
            layer.trigger 'render_start'
            layer.init(self, d3.select(this))
            layer.trigger 'render'

        @background = @content.select('rect.background',':first-child').singleton()

        if @zoomable
            @radial_domain = @r.domain()[1] - @r.domain()[0]
            prev_scale = 1
            @zoomer = d3.behavior.zoom().on 'zoom', =>
                scale = @zoomer.scale()
                if scale != prev_scale
                    @r.domain [center=@r.domain()[0], center+@radial_domain/scale]
                    @_draw 'zoom'
                prev_scale = scale
            if @zoom_extent? then @zoomer.scaleExtent @zoom_extent
            @zoomer @content.all
            # Disable D3's double-click from zoomin in
            @content.all.on 'dblclick.zoom', null
            # Disable D3's double-touch from zooming in
            # http://stackoverflow.com/questions/19997351/d3-behavior-zoom-disable-double-tap-behaviour/34999401#34999401
            last_touch_event = undefined
            touchstart = ->
                if d3.event.timeStamp-last_touch_event?.timeStamp < 500 and d3.event.touches.length == 1
                    d3.event.stopPropagation()
                    last_touch_event = undefined
                last_touch_event = d3.event
            @layers_svg.all.on 'touchstart.zoom', touchstart
            @background.all.on 'touchstart.zoom', touchstart

    _size: =>
        @content.all.attr 'transform', 'translate('+@width/2+','+@height/2+')'
        @radius = Math.min(@width,@height) / 2
        @r.range [0, @radius-1]
        for layer in @layers
            layer.size @width, @height
            layer.t.clamp(true).range @angular_range
        @background.position
            x: -@width/2
            y: -@height/2
            width: @width
            height: @height

    _update: (origin)=>
        @layers_selection.update()
        layer.update(origin) for layer in @layers
        return this

    _draw: (origin)=>
        layer.draw(origin) for layer in @layers
        return this

    _style: (style_new)=>
        @layers_selection.style()
        for layer in @layers
            layer.style(style_new)
            if not layer.rendered then layer.trigger 'rendered'
            layer.rendered = true
        return this

    # Convert cartesean x,y coordinates to polar coordinates.
    # @param x [Number] x pixel value with 0 in the middle
    # @param y [Number] y pixel value with 0 in the middle
    # @return [Array<Number>] Array of theta in radians and radial distance in pixels
    @toPolar: (x, y)->
        # Convert coordinate to clockwise polar coordinates based on a flipped y axis with 0rad up
        [Math.atan(y/x) + (0.5+(if x<0 then 1 else 0))*Math.PI, Math.sqrt(x*x+y*y)]

    # Convert cartesean x,y coordinates to polar coordinates based on this chart's scales.
    # @param x [Number] x pixel value with 0 in the middle
    # @param y [Number] y pixel value with 0 in the middle
    # @return [Array<Number>] Array of theta in this chart's `t` domain and radial distance in this chart's `r` domain.
    toPolar: (x, y)=>
        [theta, radius] = c3.Polar.toPolar x,y
        # If user specified angular_range in terms of negative degrees, then we may need to translate.
        if theta > @t.range()[1] and @t.range()[0]<0 and theta > Math.PI then theta -= 2*Math.PI
        [@t.invert(theta), @r.invert(radius)]


###################################################################
# Polar Layer
###################################################################

# A layer for a {c3.Polar polar chart}.
# @abstract
# @author Douglas Armstrong
class c3.Polar.Layer
    @version: 0.1
    type: 'layer'
    @_next_uid: 0

    # [Array] Data for this layer  _This can be set for each individual layer or a default for the entire chart._
    data: undefined
    # [String] User name for this layer.  This is used in legends, for example.
    name: undefined
    # [String] CSS class to assign to this layer for user style sheets to customize
    class: undefined
    # [{https://github.com/mbostock/d3/wiki/Scales d3.scale}] Scale for the _radial_ dimension for this layer.
    # Please set the _domain()_, c3 will set the _range()_.
    # _The scale may be set for the entire chart instead of for each layer._
    r: undefined
    # [{https://github.com/mbostock/d3/wiki/Scales d3.scale}] Scale for the _angular_ dimension for this layer.
    # Please set the _domain()_, c3 will set the _range()_.
    # _The scale may be set for the entire chart instead of for each layer._
    t: undefined
    # [{c3.Selection.Options}] Options to set the **class**, **classes**, **styles**,
    # **events**, and **title** for this layer.
    options: undefined
    # [Object] An object to setup event handlers to catch events triggered by this c3 layer.
    # The keys represent event names and the values are the cooresponding handlers.
    handlers: undefined

    constructor: (opt)->
        c3.util.extend this, new c3.Dispatch
        c3.util.extend this, opt
        @uid = c3.Polar.Layer._next_uid++

    # Internal function for the Polar Chart to prepare the layer
    init: (@chart, @g)=>
        @r ?= @chart.r
        @t ?= @chart.t
        @data ?= @chart.data
        if @class? then @g.classed @class, true
        if @handlers? then @on event, handler for event, handler of @handlers
        @content = c3.select(@g)

        # Apply classes to layer g nodes based on the `type` of the layer object hierarchy
        prototype = Object.getPrototypeOf(@)
        while prototype
            if prototype.type? then @g.classed prototype.type, true
            prototype = Object.getPrototypeOf prototype

        @_init()
    _init: ->

    # Resize the layer, but don't update the rendering.  `resize()` handles both with `draw()`
    size: (@width, @height)=>
        @trigger 'resize_start'
        @radius = @chart.radius
        if @r isnt @chart.r then @r.range [0, @chart.radius-1]
        @_size()
        @trigger 'resize'
    _size: ->

    # Update the DOM bindings based on the new or modified data set
    update: (origin)=>
        if not @chart? then throw Error "Attempt to redraw uninitialized polar layer, please use render() when adding new layers"
        @_update(origin)
    _update: ->

    # Position the DOM elements based on the current scales
    draw: (origin)=>
        @trigger 'redraw_start', origin
        @_draw(origin)
        @trigger 'redraw', origin
    _draw: ->

    # Restyle existing items in the layer
    style: (style_new)=>
        @trigger 'restyle', style_new
        @_style(style_new)
        @trigger 'restyle', style_new
        return this
    _style: ->

    redraw: (origin='redraw')=>
        @update(origin)
        @draw(origin)
        @style(true)
        return this

    restyle: Layer::style

    # Convert cartesean x,y coordinates to polar coordinates based on this layer's scales.
    # @param x [Number] x pixel value with 0 in the middle
    # @param y [Number] y pixel value with 0 in the middle
    # @return [Array<Number>] Array of theta in this layer's `t` domain and radial distance in this layer's `r` domain.
    toPolar: (x, y)=>
        [theta, radius] = c3.Polar.toPolar x,y
        # If user specified angular_range in terms of negative degrees, then we may need to translate.
        if theta > @t.range()[1] and @t.range()[0]<0 and theta > Math.PI then theta -= 2*Math.PI
        [@t.invert(theta), @r.invert(radius)]


###################################################################
# Radial
###################################################################

# Layer of radial lines
# @todo Add arrowheads or dots at vector ends if requested.
# @todo Add text labels if requested.
# @author Douglas Armstrong
class c3.Polar.Layer.Radial extends c3.Polar.Layer
    @version: 0.1
    type: 'radial'

    # [Function] Accessor function to define a unique key for each data element.
    key: undefined
    # [Function] Accessor to get the value of the data element used for the vector angle.
    # _Defaults to the identity function._
    value: undefined
    # [Function] Accessor to determine if data elements are filtered in or not.
    filter: undefined
    # [Number, Function] Inner radius of the vector
    inner_radius: 0
    # [Number, Function] Outer radius of the vector.  You may use the numeric value `Infinity`.
    outer_radius: Infinity
    # [{c3.Selection.Options}] Options for the svg:g of the vector group nodes.
    # There is one node per data element.  Use this option for animating line movement.
    vector_options: undefined
    # [{c3.Selection.Options}] Options for the svg:line lines.
    line_options: undefined

    _init: ->
        @value ?= (d)-> d

        if @draggable
            self = this
            drag_value = undefined
            @dragger = d3.behavior.drag()
            @dragger.on 'dragstart', (d,i)=>
                d3.event.sourceEvent.stopPropagation() # Prevent extraneous panning events in zoomable charts
                @trigger 'dragstart', d, i
            @dragger.on 'drag', (d,i)->
                [drag_value, depth] = self.toPolar d3.event.x, d3.event.y
                d3.select(this).attr 'transform', 'rotate('+(self.t(drag_value)*180/Math.PI - 180)+')'
                self.trigger 'drag', drag_value, d, i
            @dragger.on 'dragend', (d,i)=>
                @trigger 'dragend', drag_value, d, i

    _update: (origin)->
        @current_data = if @filter? then (d for d,i in @data when @filter(d,i)) else @data

        @vectors = @content.select('g.vector').options(@vector_options).animate(origin is 'redraw')
            .bind(@current_data, @key).update()
        @lines = @vectors.inherit('line').options(@line_options).update()

    _draw: (origin)=>
        inner_radius = c3.functor @inner_radius
        outer_radius = c3.functor @outer_radius

        # Handle 'revalue' and 'rebase' in case this layer shares a chart with a sunburst so we animate properly.
        if origin isnt 'rebase'
            @vectors.animate(origin is 'redraw' or origin is 'revalue').position
                transform: (d,i)=> 'rotate('+ ((@t @value(d,i))*180/Math.PI - 180) + ')'
        else
            @vectors.animate(true).position_tweens
                transform: (d,i)=> (t)=> 'rotate('+ ((@t @value(d,i))*180/Math.PI - 180) + ')'

        @lines.animate(origin is 'redraw' or origin is 'rebase').position line_position =
            y1: (d,i)=> @r inner_radius(d,i)
            y2: (d,i)=> @r if (r=outer_radius(d,i)) isnt Infinity then r else window.innerHeight+window.innerWidth

        if @draggable
            @vectors.new.call @dragger
            # Add extra width for grabbable line area
            @grab_lines = @vectors.inherit('line.grab').animate(origin is 'redraw' or origin is 'rebase')
                .position line_position

    _style: (style_new)->
        @g.classed 'draggable', @draggable
        @vectors.style(style_new)
        @lines.style(style_new)


###################################################################
# Arc Segment Layers
###################################################################

# The root abstract layer for various other layers such as {c3.Polar.Layer.Pie pie} and {c3.Polar.Layer.Sunburst sunburst} charts.
# Do not create a layer of this type directly, instead instantiate one of it's children types.
#
# ## Extensibility
# Each layer creates the following {c3.Selection} members:
# * **arcs** - for svg:path elements for each arc segment
#
# @abstract
# @todo Add text labels for arc segments if requested.
# @author Douglas Armstrong
class c3.Polar.Layer.Segment extends c3.Polar.Layer
    @version: 0.1
    type: 'segment'

    # **REQUIRED** [Function] Accessor function to define a unique key for each data element.
    # _This has performance implications and is required for some layers and **animations**._
    key: undefined
    # [Function] Accessor to get the value of the data element.
    # Used when limiting the number of elements
    value: undefined
    # [Number] Limit the number of data elements to render based on their value.
    # _This affects the callback index parameter_
    limit_elements: undefined
    # [Number, Function] Number or callback to set the angle in radians to pad between arc segments
    pad: undefined
    # [{c3.Selection.Options}] Options to apply to each arc segment.
    # For callbacks, the first argument is the data element the second argument is the index
    arc_options: undefined

    _init: =>
        if @arc_options?.animate then @arc_options.animate_old ?= true

        # Prepare drawing function
        @arc = d3.svg.arc()
            .innerRadius (d)=> Math.max 0, @r d.y1
            .outerRadius (d)=> Math.max 0, @r d.y2
            .startAngle (d)=> @t d.x1
            .endAngle (d)=> @t d.x2
            .padAngle @pad

        @segments = @content.select('g.segments').singleton()
        @nodes = []

    _update: (origin)=>
        # Layout the nodes for all data.
        # Even if we filter with limit_elements, we need to position everything for
        # relative layouts and animating previous values
        @current_data = @_layout @data, origin

        # Limit the number of elements to bind to the DOM
        if @current_data.length > @limit_elements
            if @current_data == @data then @current_data = @data[..] # Don't sort user's array
            c3.array.sort_up @current_data, @value # sort_up is more efficient than sort_down
            @current_data = @current_data[-@limit_elements..]

        # Bind data elements to arc segments in the DOM
        @arcs = @segments.select('path').options(@arc_options).animate(origin is 'redraw' or origin is 'revalue' or origin is 'rebase')
            .bind(@current_data, @key).update()

    _draw: (origin)=>
        # Prepare to transition to the updated domain for a new root
        if @tree?
            root_node = if @root_datum? then @nodes[@key @root_datum] else { x1:0, x2:1, y1:-1 }
            # Remember the previous domain in case the last redraw/revalue animation was interrupted.
            # But, don't do this with a rebase in case the user interrupts an ongoing rebase.
            prev_t_domain = (if origin isnt 'rebase' then @prev_t_domain) ? @t.domain()
            new_t_domain = @prev_t_domain = [root_node.x1, root_node.x2]
            new_r_domain = [root_node.y1, root_node.y1+@r.domain()[1]-@r.domain()[0]]
            t_interpolation = d3.interpolate prev_t_domain, new_t_domain
            r_interpolation = d3.interpolate @r.domain(), new_r_domain
            # Set domains now for drawing things like center circle or redrawing other layers immediatly,
            # though arc animation will transition it later if we are animated.
            @r.domain new_r_domain
            @t.domain new_t_domain

        # Animate the positioning of nodes and any transition to a new root
        # TODO optimize this
        @arcs.animate(origin is 'redraw' or origin is 'revalue' or origin is 'rebase').position_tweens
            'd': (d)=>
                node = @nodes[@key d]
                arc_interpolation = d3.interpolateObject(
                    { x1:node.px1 ? node.x1, x2:node.px2 ? node.x2, y1:node.py1 ? node.y1, y2:node.py2 ? node.y2 },
                    node )
                (t)=>
                    if @tree?
                        @t.domain t_interpolation(t)
                        @r.domain r_interpolation(t)
                    @arc arc_interpolation(t)

        if origin is 'zoom' then @arcs.old.remove()

    _style: (style_new)=>
        @arcs.style(style_new)

    # Return the calculated position for a data element
    # @param key [Number] The key for a data element to get the position for
    # @return Returns an object with the calculated position:
    # * **x1** - start angle in `t` domain
    # * **x2** - end angle in `t` domain
    # * **y1** - inner radius in `r` domain
    # * **y2** - outer radius in `r` domain
    # * **datum** - reference to the associated datum
    get_position_from_key: (key)=> @nodes?[key]


###################################################################
# Arc
###################################################################

# A general-purpose layer of arc segments
# @author Douglas Armstrong
class c3.Polar.Layer.Arc extends c3.Polar.Layer.Segment
    @version: 0.1
    type: 'arc'

    # [Number, Function] Inner radius of the arc segment
    inner_radius: 0
    # [Number, Function] Outer radius of the arc segment
    outer_radius: 1
    # [Number, Function] Start angle for the arc segment
    start_angle: 0
    # [Number, Function] End angle for the arc segment
    end_angle: 2*Math.PI

    _layout: (data)=>
        start_angle = c3.functor @start_angle
        end_angle = c3.functor @end_angle
        inner_radius = c3.functor @inner_radius
        outer_radius = c3.functor @outer_radius
        for d,i in data
            key = @key d,i
            node = @nodes[key]
            @nodes[key] =
                px1: node?.x1
                px2: node?.x2
                py1: node?.y1
                py2: node?.y2
                x1: start_angle d,i
                x2: end_angle d,i
                y1: inner_radius d,i
                y2: outer_radius d,i
        return data


###################################################################
# Pie Chart
###################################################################

# A Pie Chart.
# If you limit elements and sort by value then you can defined `other_options` to
# create an arc segment that represents all of the "other" values.
#
# ## Extensibility
# Each layer creates the following {c3.Selection} members:
# * **other_arc** - for svg:path elements for the "other" arc segment.
#
# @author Douglas Armstrong
class c3.Polar.Layer.Pie extends c3.Polar.Layer.Segment
    @version: 0.1
    type: 'pie'

    # [Boolean, Function] How to sort the partitioned pie chart segments.
    # `true` sorts based on value, or you can define an alternative accessor function
    # to be used for sorting.  The `other` arc only appears if sort is `true`.
    sort: false
    # [Number, Function] Inner radius of the arc segment.
    # _This may be called with undefined data for the "other" arc segment._
    # The first argument is the data element the second argument is the index
    inner_radius: 0
    # [Number, Function] Outer radius of the arc segment.
    # The first argument is the data element the second argument is the index
    # _This may be called with undefined data for the "other" arc segment._
    outer_radius: 1
    # [{c3.Selection.Options}] Options to apply for an "other" arc segment
    # when limiting data with `limit_elements`
    # For callbacks, the first argument is the data element the second argument is the index
    other_options: undefined

    _init: =>
        super
        if not @key? then throw Error "key() accessor required for Pie charts"

    _layout: (data)=>
        inner_radius = c3.functor @inner_radius
        outer_radius = c3.functor @outer_radius
        total = 0
        total += @value(d) for d in data
        angle = 0
        delta = 1 / (total || 1)
        if @sort
            data = data[..]
            c3.array.sort_down data, @value
        for d in data
            key = @key d
            node = @nodes[key]
            @nodes[key] =
                px1: node?.x1
                px2: node?.x2
                py1: node?.y1
                py2: node?.y2
                x1: angle
                x2: angle += @value(d) * delta
                y1: inner_radius d
                y2: outer_radius d
        return data

    _draw: (origin)=>
        super
        if @other_options
            @other_arc = @content.select('path.other').options(@other_options).animate(origin is 'redraw')
            if @data.length > @limit_elements and @sort is true
                @other_arc.singleton().update().position_tweens 'd': (d,i)=>
                    other_node =
                        x1: @nodes[@key @current_data[0]].x2
                        x2: 1
                        y1: c3.functor(@inner_radius)() # Call with undefined data
                        y2: c3.functor(@outer_radius)()
                    interpolate = d3.interpolateObject (@prev_other_node ? other_node), other_node
                    @prev_other_node = other_node
                    return (t)=> @arc interpolate(t)
            else @other_arc.bind([]) # Remove other arc with possible binding fade animation

    _style: (style_new)=>
        super
        @other_arc?.style style_new


###################################################################
# Sunburst
###################################################################

# A polar layer that is similar to a {c3.Polar.Layer.Pie pie chart} except that you
# can visualize hierarchical tree data.  It is like a polar version of the
# {c3.Plot.Layer.Swimlane.Icicle Icicle} Plot layer.
#
# A `key()` callback is required for this layer.
# Specify a callback for either `parent_key`,
# `children`, or `children_keys` to describe the hierarchy.
# If using `parent_key` or `children_keys` the `data` array shoud include all nodes,
# if using `children` it only should include the root nodes.
# Define either `value()` or `self_value()` to value the nodes in the hierarchy.
#
# For proper animation, or if you care about performance, you can pass the
# parameter `revalue` to `redraw('revalue')` if you are keeping the same dataset
# hierarchy, and only changing the element's values.
# The Sunburst layer can use a more optimized algorithm in this situation.
#
# ## Events
# * **rebase** Called with the datum of a node when it becomes the new root
#   or with `null` if reverting to the top of the hierarchy.
#
# @author Douglas Armstrong
class c3.Polar.Layer.Sunburst extends c3.Polar.Layer.Segment
    @version: 0.1
    type: 'sunburst'

    # [Function] Accessor to get the "_total_" value of the data element.
    # That is the total value of the element itself inclusive of all of it's children's value.
    # You can define either _value_ or _self_value_.
    value: undefined
    # [Function] The `value` accessor defines the "total" value for an element, that is the value of
    # the element itself plus that of all of its children.  If you know the "self" value of an
    # element without the value of its children, then define this callback accessor instead.
    # The `value` option will then also be defined for you, which you can use to get the total value
    # of an element after the layer has been drawn.
    self_value: undefined
    # [Boolean, Function] How to sort the partitioned tree segments.
    # `true` sorts based on _total_ value, or you can define an alternative
    # accessor function to be used for sorting.
    sort: false
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
    # [Number] Don't bother rendering segments whose value is smaller than this
    # percentage of the current domain focus. (1==100%)
    limit_min_percent: 0.001
    # Data element that represents the root of the hierarchy to render.
    # If this is specified then only this root and its subtree will be rendered
    # When {c3.Polar.Layer.Sunburst#rebase rebase()} is called or a node is clicked on
    # it will animate the transition to a new root node, if animation is enabled.
    root_datum: null

    _init: =>
        super
        if not @key? then throw Error "key() accessor required for Sunburst layers"
        @arc_options ?= {}
        @arc_options.events ?= {}
        @arc_options.events.click ?= (d)=>
            @rebase if d isnt @root_datum then d
            else (if @parent_key? then @nodes[@parent_key d] else @nodes[@key d].parent)?.datum
        @bullseye = @content.select('circle.bullseye')
        @bullseye_options ?= {}
        @bullseye_options.events ?= {}
        @bullseye_options.events.click ?= => @rebase null
        @bullseye_options.title ?= "Navigate to root of tree"
        @center = @content.select('circle.center').singleton()

    _layout: (data, origin)=>
        # Construct the tree hierarchy
        if origin isnt 'revalue' and origin isnt 'rebase'
            @tree = new c3.Layout.Tree
                key: @key,
                parent_key: @parent_key, children_keys: @children_keys, children: @children
                value: @value, self_value: @self_value
            @nodes = @tree.construct data

        # Compute the "total value" of each node
        if origin isnt 'rebase'
            @value = @tree.revalue()

        # Partition the arc segments based on the node values
        # We need to do this even for 'rebase' in case we shot-circuited previous paritioning
        return @tree.layout(
            if origin isnt 'revalue' and origin isnt 'rebase' then @sort else false
            @limit_min_percent
            @root_datum
        )

    # Navigate to a new root node in the hierarchy representing the `datum` element
    rebase: (@root_datum)=>
        @trigger 'rebase_start', @root_datum
        @chart.redraw 'rebase' # redraw all layers since the scales will change
        @trigger 'rebase', @root_datum

    # Navigate to a new root node in the hierarchy represented by `key`
    rebase_key: (root_key)=> @rebase @nodes[root_key]?.datum

    _update: (origin)=>
        super
        @center.options(@center_options).update()
        @bullseye.options(@bullseye_options).animate(origin is 'redraw' or origin is 'rebase')
            .bind(if @root_datum? then [@root_datum] else []).update()

    _draw: (origin)=>
        super
        # Draw the center circle and bullseye
        @bullseye.animate(origin is 'redraw').position
            r: Math.max 0, @r @r.domain()[0]+0.5
        # Only adjust center circle if resizing, changing the @r scale, or zooming
        if origin isnt 'rebase'
            @center.animate(origin is 'redraw').position
                r: Math.max 0, @r if @root_datum? then @nodes[@key @root_datum].y2 else 0

    _style: (style_new)=>
        super
        @center.style(style_new)
        @bullseye.style(style_new)

    get_leaf: (position)=> if @tree?
        get_leaf = (nodes, parent)->
            for node in nodes when node.x1 <= position <= node.x2
                if node.children.length then return get_leaf node.children, node
                return node.datum
            return parent.datum
        get_leaf @tree.root_nodes
