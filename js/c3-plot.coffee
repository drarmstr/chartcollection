# c3 Visualization Library
# XY Plots

###################################################################
# Plot
###################################################################

# An XY Plot is a chart with an X and a Y axis.  This chart doesn't visualize data directly itself, but
# contains a set of {c3.Plot.Layer layers} on top of each other.
# Layers provide for such charts as bar charts, area graphs, scatter plots, segment stripcharts, etc.
# The data, scales, and x/y accessors are all required, but may be provided either to the plot itself as a
# default for all layers or individually as an override on each layer or some combination.
#
# ## Styling
# * An svg:rect.background is created for styling the background of the plot content
#
# ## Extensibility
# c3 will set the following members of the `content` selection:
# * **width** - width of the content of the plot layers
# * **height** - height of the content of the plot layers
#
# @author Douglas Armstrong
# @todo Avoid negative plot height/width's when div is too small to fit margins and axes.
class c3.Plot extends c3.Chart
    @version: 0.1
    type: 'plot'
    # [Array<{c3.Plot.Layer}>] Array of {c3.Plot.Layer layers} that constitute this XY Plot
    layers: []
    # [Array<{c3.Axis}>] Array of {c3.Axis axis} objects to attach to this plot.
    axes: []
    # [Array] Default data array for layers in this plot.
    # _This can be set for each individual layer or a default for the entire chart._
    data: []
    # [{https://github.com/mbostock/d3/wiki/Scales d3.scale}] Scale for the _horizontal_ X axis.
    # Please set the _domain()_, c3 will set the _range()_.
    # _This can be set for each individual layer or a default for the entire chart._
    h: undefined
    # [{https://github.com/mbostock/d3/wiki/Scales d3.scale}] Scale for the _vertical_ Y axis.
    # Please set the _domain()_, c3 will set the _range()_.
    # _This can be set for each individual layer or a default for the entire chart._
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
    h_orient: 'left'
    # [String] `top` for 0 to be at the top, `bottom` for the bottom.
    v_orient: 'bottom'
    # [Function | Array<Number|String]] Automatic scaling for horizontal domain.  _EXPERIMENTAL_
    # Optional domain which is used to set the `h` scale at render time or with `rescale()`.
    # It may be a callback to allow for dynamic domains.
    # Either min or max values may also be a enum to automatically size the domain:
    # * `auto` will map to `min_y()` or `max_y()`.
    # * `auto10` will map to `min_y()` or `max_y()` with a 10% buffer.
    h_domain: undefined
    # [Function | Array<Number|String]] Automatic scaling for vertical domain.  _EXPERIMENTAL_
    # Optional domain which is used to set the `v` scale at render time or with `rescale()`.
    # It may be a callback to allow for dynamic domains.
    # Either min or max values may also be a enum to automatically size the domain:
    # * `auto` will map to `min_y()` or `max_y()`.
    # * `auto10` will map to `min_y()` or `max_y()` with a 10% buffer.
    v_domain: undefined
    # [Number, Object] Set margins around the plot in pixels.
    # Can either be a number to set all margins or an object to individually set the _top_, _bottom_, _left_, and _right_ margins.
    margins: undefined
    # [Boolean] Crop the plot rendering at the edge of the plot so it doesn't overlap the axis and margins.
    # Set to true or false to enable/disable, or set to '`x`' or '`y`' to only crop in one direction.
    crop_margins: true
    # [{c3.Selection.Options}] Options to apply to each layer.  For callbacks, the first argument
    # is the layer object and the second argument is the index of the layer
    layer_options: undefined
    # [{c3.Selection.Options}] Options to apply to each axis.  For callbacks, the first argument
    # is the axis object and the second argument is the index of the axis
    axis_options: undefined

    _init: =>
        # Set default scales here instead of class-level so the defaults are still per-instance
        @h ?= d3.scale.linear()
        @v ?= d3.scale.linear()

        # Setup any Axes
        if @axes
            axes_group = @svg.select('g.axes',':first-child').singleton()
            @axes_selection = axes_group.select('g.axis',null,true).options(@axis_options).bind @axes, (axis)->axis.uid
            self = this
            @axes_selection.new.each (axis)->
                axis.anchor = this
                axis.scale ?= if axis instanceof c3.Axis.X then self.h else self.v
                axis.init()

        # Setup the Layers
        @layers_svg = @content.select('svg.layers',null,true).singleton()
        @layers_selection = @layers_svg.select('g.layer')
            .bind @layers, (layer)->layer.uid
            .options @layer_options, (layer)->layer.options
        self = this
        @layers_selection.all.order()
        @layers_selection.new.each (layer)-> layer.init(self, d3.select(this))

        # Check if we were rendered to allow render() to be used to add/remove layers and axes.
        if not @rendered
            # Setup the margins
            @margins ?= {}
            if typeof @margins is 'number' then @margins = { top:@margins, bottom:@margins, left:@margins, right:@margins }
            else c3.util.defaults @margins, { top:0, bottom:0, left:0, right:0 }
            if @axes? then for axis in @axes
                @margins[axis.orient] += axis.axis_size

            # A background rect for styling the background or setting up events for just the content area.
            @background = @content.select('rect.background',':first-child').singleton()
              .options({
                styles: {visibility: 'hidden', 'pointer-events': 'all'}
              }).style()
        return

    _size: =>
        @content.height = @height - @margins.top - @margins.bottom
        @content.width = @width - @margins.left - @margins.right
        if @content.height <= 0 then @content.height = 1
        if @content.width <= 0 then @content.width = 1
        @layers_svg.all.attr('height',@content.height).attr('width',@content.width)
        if @crop_margins? then switch @crop_margins
            when true then @layers_svg.all.style 'overflow', 'hidden'
            when false then @layers_svg.all.style 'overflow', 'visible'
            when 'x' then @layers_svg.all.style { 'overflow-x':'hidden', 'overflow-y':'visible' }
            when 'y' then @layers_svg.all.style { 'overflow-x':'visible', 'overflow-y':'hidden' }
        for layer in @layers
            layer.size @content.width, @content.height
        if @margins.left or @margins.top then @content.all.attr 'transform', "translate(#{@margins.left},#{@margins.top})"
        if @axes
            for axis in @axes
                axis.height = @content.height
                axis.width = @content.width
                axis._size()
                axis.content.all.attr 'transform', switch axis.orient
                    when 'left' then "translate(#{@margins.left},#{@margins.top})"
                    when 'right' then "translate(#{@width-@margins.right},#{@margins.top})"
                    when 'top' then "translate(#{@margins.left},#{@margins.top})"
                    when 'bottom' then "translate(#{@margins.left},#{@height-@margins.bottom})"
        @background.all.attr('width',@content.width).attr('height',@content.height)
        return

    _update: (origin)=>
        @axes_selection.update()
        @layers_selection.update()
        layer.update(origin) for layer in @layers
        if not @rendered then @scale('render')  # EXPERIMENTAL
        return

    _draw: (origin)=>
        layer.draw(origin) for layer in @layers
        if @axes then axis.draw() for axis in @axes
        return

    _style: (style_new)=>
        @axes_selection.style()
        @layers_selection.style()

        for layer in @layers
            layer.style(style_new)
            layer.rendered = true
        return

    # EXPERIMENTAL RESCALE
    # Update any automatic scales
    # @note Needs to happen after update() so that stacked layers are computed
    # @return [Boolean] Returns true if any domains were changed
    scale: (origin)=>
        refresh = false
        if @h_domain?
            h_domain = if typeof @h_domain is 'function' then @h_domain.call(this) else @h_domain[..]
            if h_domain[0] is 'auto' then h_domain[0] = @min_x(true)
            if h_domain[0] is 'auto10' then h_domain[0] = @min_x(true) * 0.9
            if h_domain[1] is 'auto' then h_domain[1] = @max_x(true)
            if h_domain[1] is 'auto10' then h_domain[1] = @max_x(true) * 1.1
            if h_domain[0]!=@h.domain()[0] or h_domain[1]!=@h.domain()[1]
                @h.domain h_domain
                @orig_h?.domain h_domain # TODO Ugly hack; need to cleanup zoom as a mixin
                refresh = true
        if @v_domain?
            v_domain = if typeof @v_domain is 'function' then @v_domain.call(this) else @v_domain[..]
            if v_domain[0] is 'auto' then v_domain[0] = @min_y(true)
            if v_domain[0] is 'auto10' then v_domain[0] = @min_y(true) * 0.9
            if v_domain[1] is 'auto' then v_domain[1] = @max_y(true)
            if v_domain[1] is 'auto10' then v_domain[1] = @max_y(true) * 1.1
            if v_domain[0]!=@v.domain()[0] or v_domain[1]!=@v.domain()[1]
                @v.domain v_domain
                refresh = true
        for layer in @layers
            refresh = layer.scale() or refresh
        return refresh

    # EXPERIMENTAL RESCALE
    # An additional `re*` API which will adjust the scales for any domains with callbacks
    # See `h_domain` and `v_domain`.
    rescale: =>
        if @scale() then @draw('rescale')
        return this

    # If the auto parameter is true it will only get the value for layers which
    # share the overall plot scale and don't overwrite it with its own.
    min_x: (auto) =>
      d3.min (if auto then (l for l in @layers when l.h == @h) else @layers), (l)-> l.min_x()
    max_x: (auto) =>
      d3.max (if auto then (l for l in @layers when l.h == @h) else @layers), (l)-> l.max_x()
    min_y: (auto) =>
      d3.min (if auto then (l for l in @layers when l.v == @v) else @layers), (l)-> l.min_y()
    max_y: (auto) =>
      d3.max (if auto then (l for l in @layers when l.v == @v) else @layers), (l)-> l.max_y()


###################################################################
# Selectable Plot
###################################################################

# A type of {c3.Plot plot} that allows making selections.
# ## External Interface
# In addition to the standard {c3.base c3 interface}, this chart adds:
# * **{c3.Plot.Selectable#select select()}** - Selection a region in the chart as if the user made one.  This will not fire the `select` events to avoid infinite loops.
#
# ## Events
# * **select** - Triggered when a selection is started and being dragged.  Passed with the current selection domain.
# * **selectend** - Triggered when a selection is made.  Passed with the selected domain.
# @author Douglas Armstrong
# @todo Allow user to set events on their layers by moving brush to back?
class c3.Plot.Selectable extends c3.Plot
    @version: 0.1
    type: 'selectable'
    # [Boolean, String] Specify if plot is selectable in the `h` or `v` direction or both.
    selectable: 'hv'
    # [Boolean] When true, existing selections move/resize when dragged, otherwise a new selection will be made.
    drag_selections: true
    # [Array<Number>] Specify an initialy selected range for rendering.
    # This is updated if the user selects a range or calls {c3.Plot.Selectable#select select()}.
    selection: undefined

    _init: =>
        super
        if @selectable is true then @selectable = 'hv'
        else if @selectable is false then @selectable = ''
        @svg.all
            .classed 'h', 'h' in @selectable
            .classed 'v', 'v' in @selectable

    _size: =>
        super
        # Install brush for selections
        if not @brush?
            @brush = d3.svg.brush()
            if 'h' in @selectable then @brush.x(@h)
            if 'v' in @selectable then @brush.y(@v)

            # Setup handlers
            @brush.on 'brush', =>
                extent = if not @brush.empty() then @brush.extent() else null
                # Skip redundant 'brush' events with null for both mousedown and mouseup when deselecting
                if extent != @prev_extent
                    @select extent
                    @trigger 'select', extent
                @prev_extent = extent
            @brush.on 'brushend', =>
                extent = if not @brush.empty() then @brush.extent() else null
                @select extent
                @trigger 'selectend', extent

            # Draw brush
            @brush_selection = @content.select('g.brush').singleton()
            @brush @brush_selection.all

            # Create unbrush
            if 'v' in @selectable
                @brush_selection.select('rect.n',':first-child').singleton()
                    .all.classed('unbrush',true).attr('y',0)
                @brush_selection.select('rect.s',':first-child').singleton()
                    .all.classed('unbrush',true)
                @brush_selection.all.selectAll('g.brush > rect').attr('width',@content.width)
                if 'h' not in @selectable
                    @brush_selection.all.selectAll('g.resize > rect').attr('width',@content.width)

            if 'h' in @selectable
                @brush_selection.select('rect.w',':first-child').singleton()
                    .all.classed('unbrush',true).attr('x',0)
                @brush_selection.select('rect.e',':first-child').singleton()
                    .all.classed('unbrush',true)
                @brush_selection.all.selectAll('g.brush > rect').attr('height',@content.height)
                if 'v' not in @selectable
                    @brush_selection.all.selectAll('g.resize > rect').attr('height',@content.height)

            # Ensure D3's brush background stays behind extent, sometimes when
            # rendering a plot over an existing DOM it would get out of order.
            extent_node = @brush_selection.select('rect.extent').node()
            @brush_selection.select('rect.background').all.each ->
                this.parentNode.insertBefore this, extent_node

        # Move existing selection or start a new one
        @brush_selection.all.selectAll('rect.extent, g.resize')
            .style 'pointer-events', if not @drag_selections then 'none' else ''

        @select @selection

    # Select a region in the chart.
    # @param selection [Array<Number>, Array<Array<Number>>] The extent of the region to select or null to clear selection.
    # Depending on which axes are selectable the selection is either [x0,x1], [y0,y1], or [[x0,y0],[x1,y1]]
    select: (@selection)=>
        # Set and redraw brush
        if @selection? and @selection.length
            h_selection = if 'v' in @selectable then [@selection[0][0],@selection[1][0]] else @selection
            v_selection = if 'h' in @selectable then [@selection[0][1],@selection[1][1]] else @selection
            @brush.extent @selection
        else
            h_selection = @h.domain()
            v_selection = @v.domain()
            @brush.extent if 'h' in @selectable and 'v' in @selectable then [[0,0],[0,0]] else [0,0]
        @brush @brush_selection.all

        # Redraw unbrush
        # Use Math.abs to avoid small negative values through rounding errors
        if 'h' in @selectable
            @brush_selection.all.select('.unbrush[class~=w]').attr('width',@h h_selection[0])
            @brush_selection.all.select('.unbrush[class~=e]')
                .attr('width',Math.abs @h(@h.domain()[1])-@h(h_selection[1])).attr('x',@h h_selection[1])
        if 'v' in @selectable
            @brush_selection.all.select('.unbrush[class~=n]').attr('height',@v v_selection[1])
            @brush_selection.all.select('.unbrush[class~=s]')
                .attr('height',Math.abs @v(@v.domain()[0])-@v(v_selection[0])).attr('y',@v v_selection[0])
            if 'h' in @selectable
                @brush_selection.all.selectAll('.unbrush[class~=n], .unbrush[class~=s]')
                    .attr('x',@h h_selection[0]).attr('width',@h(h_selection[1])-@h(h_selection[0]))

        delete @prev_extent # If user adjusts selection then clear @prev_extent so we don't skip the next brush event


###################################################################
# Zoomable Plot
###################################################################

# A type of {c3.Plot plot} that allows panning and zooming.
#
# You cannot currently zoom with an ordinal scale.
# ## External Interface
# In addition to the standard {c3.base c3 interface}, this chart adds:
# * **{c3.Plot.Zoomable#focus focus()}** - Zoom the chart to the specified domain.  Will not fire zoom events.
#
# ## Events
# * **zoom** - Triggered when the user starts to zoom or pan.  Passed with the current focus domain.
# * **zoomend** - Triggered when the user finishes zooming or panning.  Passed with the focus domain.
#
# ## Extensibility
# The _h_ scale will adjust it's domain based on the current focus of the chart.  The original domain can be retreived using the _orig_h_ scale.
# @author Douglas Armstrong
# @todo Normalize zoom functionality better (horiz and vert) (for both plot and axis, maybe chart)
# @todo Support zooming with layers or axes that don't share the chart's horizontal scale
class c3.Plot.Zoomable extends c3.Plot
    @version: 0.0
    type: 'zoomable'
    # [Number] A ratio threshold.  If the focus domain is within this threshold near both edges, then the chart will snap to the full domain.
    snap_to_all: 0.01
    # [Number, String] The maximum zoom factor the user is allowed to zoom in
    # If set to _integer_ then allow zooming only until pixels are integer values.
    zoom_extent: undefined
    # [String] Enables vertical panning. Horizontal panning is controlled by the zoomer. Values are either 'h' or 'hv'. 'h' is the default. At the moment this only works reliably on the Flamechart
    pannable: 'h'

    _init: => if @rendered then super else
        super
        if @zoomable != 'h' then throw "Only horizontal zooming is currently supported"
        if @pannable != 'hv' and @pannable != 'h' then throw "Pannable options are either 'h' or 'hv'."
        @orig_h = @h.copy()
        @orig_v = @v.copy()

        # Make it zoomable!
        @zoomer = d3.behavior.zoom().on 'zoom', =>
            @trigger 'zoom', @focus @h.domain()
        # Only signal zoomend if the domain has actually changed
        @prev_zoomend_domain = @h.domain()[..]
        @zoomer.on 'zoomend', => if @h.domain()[0]!=@prev_zoomend_domain?[0] or @h.domain()[1]!=@prev_zoomend_domain?[1]
            @trigger 'zoomend', @h.domain()
            @prev_zoomend_domain = @h.domain()[..]

        # Make it pannable
        if @pannable=='hv'
            @prev_v_translate = 0
            @dragger = d3.behavior.drag()
            @dragger.on 'drag', =>
                @trigger 'verticalPan', @pan d3.event.dy
            @content.all.call @dragger

        # Only zoom over g.content; if we cover the entire SVG, then axes cause zoom to be uncentered.
        @zoomer @content.all
        # Disable D3's double-click from zooming in
        @content.all.on 'dblclick.zoom', null
        # Disable D3's double-touch from zooming in (http://stackoverflow.com/questions/19997351/d3-behavior-zoom-disable-double-tap-behaviour/34999401#34999401)
        last_touch_event = undefined
        touchstart = ->
            if last_touch_event and d3.event.touches.length == 1 and
             d3.event.timeStamp - last_touch_event.timeStamp < 500 and
             Math.abs(d3.event.touches[0].screenX-last_touch_event.touches[0].screenX)<10 and
             Math.abs(d3.event.touches[0].screenY-last_touch_event.touches[0].screenY)<10
                d3.event.stopPropagation()
                last_touch_event = undefined
            last_touch_event = d3.event
        @layers_svg.all.on 'touchstart.zoom', touchstart
        @background.all.on 'touchstart.zoom', touchstart

        # Set grabbing cursor while panning
        @content.all
            .on 'mousedown.zoomable', -> d3.select('html').classed 'grabbing', true
            .on 'mouseup.zoomable', -> d3.select('html').classed 'grabbing', false
        window.addEventListener 'mouseup', -> d3.select('html').classed 'grabbing', false

    _size: =>
        super
        c3.d3.set_range @orig_h, if @h_orient is 'left' then [0, @content.width] else [@content.width, 0]
        c3.d3.set_range @orig_v, if @v_orient is 'top' then [@content.height, 0] else [0, @content.height]
        # Update the zooming state for the new size
        current_extent = @h.domain()
        @h.domain @orig_h.domain()
        @zoomer.x @h
        if @zoom_extent? # Limit the maximum you can zoom in
            if @zoom_extent is 'integer' then @zoomer.scaleExtent [1, 1/ (@content.width/@orig_h.domain()[1])]
            else @zoomer.scaleExtent [1, @zoom_extent]
        else @zoomer.scaleExtent [1, Infinity]
        # Make sure the zoomer has the scale/translate set for the current zooming domain after a resize
        @focus current_extent

    # Zoom to a specified focus domain, but only if the domain actually changes
    # @param extent [Array<Number>] The domain to set the focus to.
    focus: (extent)=> if @rendered
        if not extent? or not extent.length then extent = @orig_h.domain()
        extent = extent[..] # Clone array so it doesn't modify caller's values
        domain = @orig_h.domain()
        domain_width = domain[1]-domain[0]

        # If the user is operating with a time scale, then convert to ms for manipulations
        extent[0] = extent[0].getTime?() ? extent[0]
        extent[1] = extent[1].getTime?() ? extent[1]

        # Don't allow the focus to go beyond the chart's domain
        if extent[0]<domain[0] then extent[1]+=domain[0]-extent[0]; extent[0]=domain[0]
        if extent[1]>domain[1] then extent[0]-=extent[1]-domain[1]; extent[1]=domain[1]
        if extent[0]<domain[0] then extent[0]=domain[0]; extent[1]=domain[1] # focus extents were too large

        # If we are close to the edges, then snap to zoom all (this helps deal with rounding errors)
        if extent[0]-domain[0]<domain_width*@snap_to_all and domain[1]-extent[1]<domain_width*@snap_to_all
            extent[0] = domain[0]
            extent[1] = domain[1]

        # Calculate the scale and translate factors based on our tweaked extent.
        scale = (domain_width) / (extent[1]-extent[0])
        translate = (domain[0]-extent[0]) * scale * (@content.width/domain_width)

        # Update the state of the zoomer to match any adjustments we made or to reflect a new resize()
        # This also updates the h scale which non-scaled layers can use for positioning
        @zoomer.translate([translate,0]).scale(scale)

        # Transform scaled layers
        @layers_svg.all.selectAll('.scaled').attr('transform','translate('+translate+' 0)scale('+scale+' 1)')

        # Perform redraws and updates for the new focus, but only if the domain actually changed
        new_domain = @h.domain()[..]
        @prev_domain ?= domain
        threshold = (new_domain[1]-new_domain[0]) / 1000000   # Deal with rounding errors
        left_diff = Math.abs(new_domain[0]-@prev_domain[0]) / threshold > 1
        right_diff = Math.abs(new_domain[1]-@prev_domain[1]) / threshold > 1
        if left_diff or right_diff

            # Zoom all of the layers
            for layer in @layers
                if layer.rendered then layer.zoom?()

            # Scale any attached axes and redraw
            if @axes then for axis in @axes when axis.scale and axis instanceof c3.Axis.X
                axis.scale.domain new_domain
                axis._draw()

            @prev_domain = new_domain
            @trigger 'redraw', 'focus'
            @trigger 'restyle', true
        return if domain[0]==extent[0] and domain[1]==extent[1] then null else new_domain

     # Note: dx (horizontal panning) is controlled by the zoomer
     pan: (dy) =>
        orig_v_domain_min = @orig_v.domain()[0]
        orig_v_domain_max = @orig_v.domain()[1]
        v = (@orig_v.invert dy) + @prev_v_translate - (if @v_orient == 'top' then orig_v_domain_max else 0)
        translate = if v > orig_v_domain_max then orig_v_domain_max else if v < orig_v_domain_min then orig_v_domain_min else v
        @v.domain [translate, translate+orig_v_domain_max]
        @prev_v_translate = translate
        # Pan all of the layers
        for layer in @layers
            if layer.rendered then layer.pan?()
        @v translate

    _draw: (origin)=>
        super
        # A bit of a hack until we clean up zooming to a widget.
        # If we render a chart that adds a layer but is already zoomed in, then we need
        # to call focus again to force the newly drawn elements to get transformed.
        if origin is 'render' and @rendered
            @prev_domain = [0,0]
            @focus @h.domain()


###################################################################
# Axis
###################################################################

# An Axis visualizes a set of tick marks and units based on the supplied **D3 scale**.
# This is an **abstract** class, please create a {c3.Axis.x} or {c3.Axis.y}.
#
# Axes may be attached to {c3.Plot XY Plots} or managed as a
# seperate DOM element for layout flexibility.
# @abstract
# @author Douglas Armstrong
# @todo Normalize the zoom/pan implementation from {c3.Plot.Zoomable}
# @todo Ability to specify tick counts for ordinal scales?
# @todo Remove dependency on d3.axis for more flexibility, cleaner implementation, and performance?
class c3.Axis extends c3.Chart
    @version: 0.1
    type: 'axis'

    # [{https://github.com/mbostock/d3/wiki/Scales d3.scale}, Boolean] Scale where the _domain()_ specifies the units to display in the axis.
    # _c3 will automatically set the range()_.
    # _If this axis is part of a {c3.Plot plot}, then the scale will default to the plot's horizontal or veritcal scale_.
    # Set to false to disable the scale from being drawn.
    scale: undefined
    # [String] Axis orientation.  Use _bottom_ or _top_ for an X axis and _left_ or _right_ for a Y axis.
    orient: undefined
    # [Boolean] Set to true to draw grid lines as well as the axis
    grid: false
    # [String] Text label for this axis
    label: undefined
    # [Boolean] Enable tick marks and labels
    ticks: true
    # [Boolean, Function] Formater function for the tick label.  _Set to `true` for displaying the default tick values._
    # _See {https://github.com/mbostock/d3/wiki/Formatting#d3_format d3.format}_.
    tick_label: true
    # [Array] An array of manually set tick values to use instead of the scale's automatic tick generation.
    tick_values: undefined
    # [Number] Specify number of ticks to generate
    tick_count: undefined
    # [Number] Size of the tick marks in pixels
    tick_size: 6
    # [Number] Width of the path that forms a line along the length of the axis
    path_size: 2
    # [Number] The overall width of a horizontal axis or height of a vertical axis
    axis_size: undefined

    constructor: (opt)->
        super

    _init: =>
        @scale ?= d3.scale.linear()
        @content.all.classed 'axis', true
        @content.all.classed @orient, true
        @axis = d3.svg.axis().orient(@orient)

    _draw: =>
        # Set these axis properties here so they can be modified between calls to redraw()
        if @scale
            @axis
                .scale @scale
                .outerTickSize @path_size
                .innerTickSize if @ticks then @tick_size else 0
                .tickValues @tick_values
                .tickFormat if not @ticks then "" else switch @tick_label
                    when false then "" # Disable tick labels
                    when true then null # Use default formatter
                    else @tick_label # Custom formatter
            if @tick_count? then @axis.ticks @tick_count
            @content.all.call @axis

        # Draw axis label if requested
        if @label
            @text_label = @content.all.selectAll('text.label').data([@label])
            @text_label.enter().append('text').attr('class','label')
            @text_label.text @label
                .text @label

        # Draw gridlines if requested
        if @grid
            @content.all.selectAll('g.tick line.grid').remove()
            @content.all.selectAll('g.tick').append('line')
                .classed 'grid', true
                .attr 'x2', switch @orient
                    when 'left' then @width
                    when 'right' then -@width
                    else 0
                .attr 'y2', switch @orient
                    when 'bottom' then -@height
                    when 'top' then @height
                    else 0

# Horizontal X-Axis
# @see c3.Axis
class c3.Axis.X extends c3.Axis
    type: 'x'
    orient: 'bottom'

    _init: =>
        super
        @axis_size ?= (if not @ticks then 0 else Math.max(@tick_size, @path_size) + (if @tick_label then 20 else 0) ) +
            (if @label then 24 else 0)

    _size: =>
        if @orient is 'top' then @content.all.attr 'transform', "translate(0,#{@height})"
        if @scale then c3.d3.set_range @scale, [0, @width]

    _draw: =>
        super
        if @label?
            @text_label.attr
                x: (@width/2)|0
                y: if @orient is 'bottom' then @axis_size else ''
                dy: '-0.5em'

# Vertical Y-Axis
# @see c3.Axis
class c3.Axis.Y extends c3.Axis
    type: 'y'
    orient: 'left'

    _init: =>
        super
        @axis_size ?= (if not @ticks then 0 else Math.max @tick_size, @path_size) +
            (if @tick_label then 42 else 0) +
            (if @label then 20 else 0)

    _size: =>
        if @orient is 'left' then @content.all.attr 'transform', "translate(#{@width},0)"
        if @scale then c3.d3.set_range @scale, [@height, 0]

    _draw: =>
        super
        if @label?
            @text_label.attr
                x: if @orient is 'left' then -@axis_size else @axis_size
                y: (@height/2)|0
                dy: if @orient is 'left' then '1em' else '-1em'
                transform: "rotate(-90,#{if @orient is 'left' then -@axis_size else @axis_size},#{(@height/2)|0})"
