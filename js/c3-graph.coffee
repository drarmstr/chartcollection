# C3 Visualization Library
# Graphs
# All Rights Reserved.

###################################################################
# Graph
###################################################################

# Graph
# @abstract
class c3.Graph extends c3.Chart
    @version: 0.1
    type: 'graph'


###################################################################
# Sankey
###################################################################

# Directed graph [**Sankey**](https://en.wikipedia.org/wiki/Sankey_diagram) visualization.
# Provide a set of nodes and weighted links between them.  Various configuration options are available
# to adjust the layout algorithm.  Add a `node_label_options` with a `text` property to add labels to the nodes.
#
# The implementation is based on the [D3 Sankey plugin](https://bost.ocks.org/mike/sankey/).
# However, it has been extended with the following:
#
# * User can define their own data structures for nodes and links.
# * Does not modify the original dataset.
# * Cycles / Back Edges are allowed.
# * Animation of dynamic datasets.
# * Nodes may have a value larger than incoming and outgoing links
# * Configurable padding and node widths based on either pixels or percentages.
# * Configuragle curvature, minimium widths, etc.
# * Tweaked layout algorithm.
#
# @author Douglas Armstrong
# @todo Link lables
# @todo Links to missing nodes
# @todo Draggable nodes
# @todo Zoom/Pan navigation
# @todo Highlighted sub-path(s) through graph
class c3.Sankey extends c3.Graph
    @version: 0.1
    type: 'sankey'

    # [Array<>] Array of user-defined node objects
    data: []
    # [Array<>] Array of user-defined link objects
    links: []
    # [Function] Accessor function to get the key for a node object
    key: undefined
    # [Function] Accessor function to get the value for a node object.
    # If not defined, then the maximum value of the input or output links of a node will be used.
    value: undefined
    # [Function] Accessor function to get the key of the source node for a link.
    # This defaults to using the `source` member of the link object.
    link_source: undefined
    # [Function] Accessor function to get the key of the target node for a link.
    # This defaults to using the `target` member of the link object.
    link_target: undefined
    # [Function] Accessor function to get the key of a link.
    # This defaults to combining the `link_source` and `link_target` accessors
    link_key: undefined
    # [Function] Accessor function to get the value of a link.
    # This defaults to using the `value` member of the link object.
    link_value: undefined
    # [Boolean] Safe mode will ensure that the sum of the link values are not
    # greater than node values for each particular node
    safe: true

    # [Number] Number of iterations to run the iterative layout algorithm.
    iterations: 32
    # [Number] An alpha factor to adjust the subsequent strength of each iteration.
    # Smaller numbers will quiesce faster.
    alpha: 0.99
    # [Number, String] The vertical padding between nodes.
    # This can be the number of pixels to attempt to use between each node.  If there are too many
    # nodes for the vertical space, then fewer may be used.
    # It can also be a string that represents the percentage of the vertical space to use for padding
    # divided among all of the nodes.
    node_padding: '20%'
    # [Number, String] The horzontal width of each node.
    # This may be a number of pixels for the node width or else a string which is the percentage of
    # the horizontal space to use for nodes.
    node_width: 30
    # [String] The type of alignment to use for the nodes:
    # * **both** - Align nodes with no inputs on the left and no outputs on the right
    # * **left** - Align nodes with no inputs on the left
    align: 'both'
    # [String] The type of path to use for links between nodes:
    # * **curve** - A curved path
    # * **straight** - A stright line
    link_path: 'curve'
    # [Number] A number representing the curvature to use for curved link paths.  Ranges from 0-1.
    link_path_curvature: 0.5
    # [Number] The ratio of node width that, if exceeded, will cause the layout to
    # overflow to the right size to avoid crowding the node columns too close together.
    # This is only valid if node_width is set as a width and not as a percentage.
    overflow_width_ratio: 0.5

    # [Number] Limit the number of nodes to visualize in the graph.
    # The nodes with the top total computed values will be rendered.
    limit_nodes: undefined
    # [Number] Limit the number of links to visualize in the graph.
    # This top number of links will be selected based on their link values.
    # However, the trailing links for all of the nodes connected by those top
    # links will also be rendered.
    limit_links: undefined

    # [{c3.Selection.Options}] Options for the svg:g layer of all nodes
    nodes_options: undefined
    # [{c3.Selection.Options}] Options for the svg:g node elements
    node_options: undefined
    # [{c3.Selection.Options}] Options for the svg:rect node elements
    rect_options: undefined
    # [{c3.Selection.Options}] Options for the svg:g layer of all links
    links_options: undefined
    # [{c3.Selection.Options}] Options for the svg:g link elements
    link_options: undefined
    # [{c3.Selection.Options}] Options for the svg:path link elements
    path_options: undefined
    # [{c3.Selection.Options}] Options for the svg:text node labels
    node_label_options: undefined
    # [{c3.Selection.Options}] Options for the svg:text link labels
    link_label_options: undefined

    _init: =>
        @h = d3.scale.linear()
        @v = d3.scale.linear()

        # Default accessors
        @key ?= (d)=> @data.indexOf(d) # NOTE: This is not efficient for any decent sized dataset
        @link_key ?= (l)=> @link_source(l)+','+@link_target(l)
        @link_source ?= (l)-> l.source
        @link_target ?= (l)-> l.target
        @link_value ?= (l)-> l.value

        @background = @content.select('rect.background').singleton().position
            x: 0
            y: 0

    _size: =>
        # The horizontal scale range is set in _draw() in case the @node_width is a percentage
        @v.range [0, @height]
        @background.position
            width: @width
            height: @height

        # If we are resizing, need to call _update() if:
        # @node_padding is based on a pixel size or @overflow_width_ratio is sets
        if (!isNaN @node_padding) or (!isNaN @node_width and @overflow_width_ratio)
            @_update()

    _update_data: (origin)=>
        # The first render() calls _size() which might call us.  If so, then don't repeat the work.
        if origin is 'render' and !isNaN @node_padding then return

        # Prepare the set of nodes and links, cache the link values
        @nodes = @current_nodes = {}
        @node_links = node_links = {}
        for link in @links
            link_key = @link_key link
            link_value = @link_value link
            if not link_value then continue
            if node_links[link_key]? then throw Error "Link with duplicate source and target specified"
            node_links[link_key] = { value: @link_value(link) }

            # Prepare set of nodes and their interconnected links
            node = @nodes[@link_source link] ?= { source_links: [], target_links: [] }
            node.target_links.push link
            node = @nodes[@link_target link] ?= { source_links: [], target_links: [] }
            node.source_links.push link

        # Gather just the set of nodes that are linked to
        data = (datum for datum in @data when @key(datum) of @nodes)

        # Compute the value for each node
        if @value? and not @safe
            @nodes[@key datum].value = @value(datum) for datum in data
        else
            key = @key
            for datum in data
                node = @nodes[key datum]
                node.value = Math.max(
                    d3.sum(node.source_links, (l)=> node_links[@link_key l].value),
                    d3.sum(node.target_links, (l)=> node_links[@link_key l].value) )
                # If in safe mode, then use @value() as long as it is less than sum of links
                if @value? then node.value = Math.max(node.value, @value(datum))
        for key,node of @nodes when not node.value?
            throw Error "Missing nodes are not currently supported"

        # Pre-compute the sums of link values
        for key, node of @nodes
            node.links_sum =
                d3.sum(node.source_links, (l)=> node_links[@link_key l].value) +
                d3.sum(node.target_links, (l)=> node_links[@link_key l].value)

        # Detect back edges / cycles
        visited = {}
        # Loop through all nodes to ensure full coverage, even for disjoint graphs
        for key, node of @nodes when not visited[key]
            stack = []
            (detect_backedge = (key, node)=>
                visited[key] = true
                stack.push node
                for link in node.target_links
                    target_key = @link_target link
                    target = @nodes[target_key]
                    node_links[@link_key link].backedge = target in stack
                    if not visited[target_key] then detect_backedge target_key, target
                stack.pop()
            )(key, node)

        return null


    _update: (origin)=>
        @_update_data(origin)

        if @limit_links?
            # Determine the top links to limit
            current_links = @links[..]
            c3.array.sort_up current_links, @link_value
            current_links = current_links[-@limit_links..current_links.length-1]

            # Collect the set of nodes connected to those top links
            @current_nodes = {}
            for link in current_links
                for key in [@link_source(link), @link_target(link)]
                    @current_nodes[key] = @nodes[key]

        if @limit_nodes?
            # Sort based on the calculated node value instead of the user-provided
            # value assessor in case safe mode increased the size of a node due to its links.
            top_keys = (key for key of @nodes)
            c3.array.sort_up top_keys, (key)=> @nodes[key].value
            top_keys = top_keys[-@limit_nodes..top_keys.length-1]
            @current_nodes = {}
            @current_nodes[key] = @nodes[key] for key in top_keys


        # Compute the x position of each node
        remaining_nodes = @current_nodes
        x = 0
        while not c3.util.isEmpty remaining_nodes
            next_nodes = {}
            for key, node of remaining_nodes
                node.x = x;
                for link in node.target_links when not @node_links[@link_key link].backedge
                    target_key = @link_target link
                    target_node = @current_nodes[target_key]
                    next_nodes[target_key] = target_node if target_node?
            remaining_nodes = next_nodes
            x++

        # Right align nodes with no targets
        x--
        if @align is 'both'
            for key, node of @nodes
                if not node.target_links.length then node.x = x

        # Compute horizontal domain
        @h.domain [0, x]

        @_layout origin


    _layout: (origin)=>
        node_links = @node_links

        # Prepare set of columns
        @columns = columns = d3.nest()
            .key (node)-> node.x
            .sortKeys d3.ascending
            #.sortValues d3.descending
            .entries (node for key,node of @current_nodes)
            .map (g)-> g.values
        c3.array.sort_up @columns, (column)-> column[0].x # d3's sortKeys didn't work?

        # Calculate node padding and the vertical domain
        # Start by determining the percentage of each column to use for padding
        if !isNaN @node_padding
            for column in columns
                column.padding_percent = @node_padding*(column.length-1) / @height
                if column.padding_percent > 0.8 then column.padding_percent = 0.8
        else if @node_padding.charAt?(@node_padding.length-1) is '%'
            for column in columns
                column.padding_percent = if column.length is 1 then 0 else @node_padding[..-2] / 100
                if column.padding_percent is 1 then column.padding_percent = 0.999
        else throw new Error "Unsupported node_padding parameter: "+@node_padding
        # Calculate the maximum vertical domain, including padding
        v_domain = d3.max (d3.sum(column,(node)->node.value) / (1-column.padding_percent) for column in columns)
        @v.domain [0, v_domain]
        # Calculate node padding in terms of the value domain
        for column in columns
            column.padding = if column.length is 1 then 0 else
                v_domain * column.padding_percent / (column.length-1)

        # Detect collisions and move nodes to avoid overlap
        collision_detection = =>
            for column in columns
                c3.array.sort_up column, (node)-> node.y

                # Push overlapping nodes down
                y = 0
                for node in column
                    dy = y - node.y
                    if dy > 0 then node.y += dy
                    y = node.y + node.value + column.padding

                # If they extend past the bottom, then push some back up
                if node.y+node.value > @v.domain()[1]
                    y = @v.domain()[1]
                    for node in column by -1
                        dy = node.y + node.value - y
                        if dy > 0 then node.y -= dy
                        else break
                        y = node.y - column.padding

        # Layout the links along the nodes
        layout_links = =>
            link_key = @link_key
            link_source = @link_source
            link_target = @link_target
            for column in columns
                column_padding =
                    if column.length > 1 then column.padding
                    else if column.length == 1 then @v.domain()[1] - column[0].value
                    else 0
                for node in column
                    c3.array.sort_up node.source_links, (link)=> @nodes[link_source link].y
                    trailing_y = node.y - column_padding/2
                    trailing_padding = (column_padding) / (node.source_links.length-1)
                    y = node.y
                    for link in node.source_links
                        node_link = node_links[link_key link]
                        node_link.ty = y
                        y += node_link.value
                        node_link.tx = node.x
                        # Trailing link to missing node
                        if link_source(link) not of @current_nodes
                            node_link.sx = node.x - 1
                            node_link.sy = trailing_y
                            # Workaround for gradients failing with horizontal paths (Chrome 5/2/16)
                            if @v(node_link.sy).toFixed(3) == @v(node_link.ty).toFixed(3)
                                node_link.sy += @v.invert(1)
                        trailing_y += node_link.value + trailing_padding

                    # TODO: Normalize code for layout of target and source links.
                    c3.array.sort_up node.target_links, (link)=> @nodes[link_target link].y
                    y = node.y
                    trailing_y = node.y - column_padding/2
                    trailing_padding = (column_padding) / (node.target_links.length-1)
                    for link in node.target_links
                        node_link = node_links[link_key link]
                        node_link.sy = y
                        y += node_link.value
                        node_link.sx = node.x
                        # Trailing link to missing node
                        if link_target(link) not of @current_nodes
                            node_link.tx = node.x + 1
                            node_link.ty = trailing_y
                            # Workaround for gradients failing with horizontal paths (Chrome 5/2/16)
                            if @v(node_link.sy).toFixed(3) == @v(node_link.ty).toFixed(3)
                                node_link.ty += @v.invert(1)
                        trailing_y += node_link.value + trailing_padding

        # Give nodes and links an initial position
        y = 0
        if columns.length
            # Arrange the first column with larges nodes on each end in an attempt to avoid cross-over...
            c3.array.sort_up columns[0], (node)-> node.value
            tmp = columns[0][..]
            for r,i in d3.merge [(i for i in [columns[0].length-1..0] by -2), (i for i in [columns[0].length%2..columns[0].length-1] by 2)]
                columns[0][i] = tmp[r]
            for node in columns[0]
                node.y = y
                y += node.value + columns[0].padding
        for column,j in columns when j
            # For each subsequent column, align the nodes to the right of their sources to attempt flatter links
            for node in column
                weighted_y = 0
                source_link_value = 0
                total_weighted_y = 0
                total_source_link_value = 0
                for link in node.source_links
                    node_link = @node_links[@link_key link]
                    source_node = @current_nodes[@link_source link]
                    if not source_node? or not source_node.y? then continue
                    total_weighted_y += source_node.y * node_link.value
                    total_source_link_value += node_link.value
                    if source_node.x >= node.x then continue # Only layout initially for links that flow rightward
                    weighted_y += source_node.y * node_link.value
                    source_link_value += node_link.value
                if source_link_value
                    node.y = weighted_y / source_link_value
                else if total_source_link_value
                    # If all source links come from the right, then just take the average of all of them
                    node.y = total_weighted_y / total_source_link_value
                else
                    # If there are no source links at all, then the average of the target links
                    # This can't happen with a normal Sankey, since all nodes with no sources are in the first column;
                    # but, it can happen with a butterfly.
                    target_link_value = 0
                    for link in node.target_links
                        node_link = @node_links[@link_key link]
                        target_node = @current_nodes[@link_target link]
                        if not target_node? or not target_node.y? then continue
                        weighted_y += target_node.y * node_link.value
                        target_link_value += node_link.value
                    node.y = weighted_y / (target_link_value || 1)
        ## Give nodes and links an initial position
        #for column in columns
        #     node.y = i for node,i in column
        collision_detection()
        layout_links()

        # Iterate to shift nodes closer to their neighbors based on the value of their links
        alpha = 1
        for iteration in [0...@iterations]
            alpha *= @alpha

            for column in columns
                for node in column
                    delta = 0
                    for link in node.source_links
                        node_link = @node_links[@link_key link]
                        if node_link.tx > node_link.sx # Only align rightward links
                            delta += (node_link.sy - node_link.ty) * node_link.value #* (0.5+(1/(2*Math.abs(node.x-@nodes[@link_source link].x))))
                    for link in node.target_links
                        node_link = @node_links[@link_key link]
                        if node_link.tx > node_link.sx # Only align rightward links
                            delta += (node_link.ty - node_link.sy) * node_link.value #* (0.5+(1/(2*Math.abs(node.x-@nodes[@link_target link].x))))
                    delta /= node.links_sum
                    node.y += delta * alpha
            collision_detection()
            layout_links()

        # Bind data to the DOM
        current_link_keys = {}
        for key,node of @current_nodes
            for links in [node.source_links, node.target_links]
                for link in links
                    current_link_keys[@link_key link] = link
        current_links = (link for key,link of current_link_keys)
        @links_layer = @content.select('g.links').singleton().options(@links_options).update()
        @link_g = @links_layer.select('g.link').options(@link_options).animate(origin isnt 'render')
            .bind(current_links, @link_key).update()
        @paths = @link_g.inherit('path').options(@path_options).update()
        @link_g.all.classed 'backedge', (link)=> @node_links[@link_key link].backedge

        current_data = (datum for datum in @data when @key(datum) of @current_nodes)
        @nodes_layer = @content.select('g.nodes').singleton().options(@nodes_options).update()
        @node_g = @nodes_layer.select('g.node').options(@node_options).animate(origin isnt 'render')
            .bind(current_data, @key).update()
        @rects = @node_g.inherit('rect').options(@rect_options).update()

        # Bind optional node labels
        if @node_label_options?
            @node_labels_clip = @node_g.inherit('svg.label','restore')
            @node_labels = @node_labels_clip.inherit('text','restore').options(@node_label_options).update()
        else
            @node_labels_clip?.all.remove()
            delete @node_labels
            delete @node_labels_clip

        # Style links that fade out to unrendered nodes
        @paths.all.classed
            fade_left: (link)=> @link_source(link) not of @current_nodes
            fade_right: (link)=> @link_target(link) not of @current_nodes
        # Workaround packing/build issues for systems that don't like url() syntax in CSS files...
        @paths.all.attr 'mask', (link)=>
            if @link_source(link) not of @current_nodes then 'url(#mask_fade_left)'
            else if @link_target(link) not of @current_nodes then 'url(#mask_fade_right)'
            else null


    _draw: (origin)=>
        # Calculate node_width in pixels
        if !isNaN @node_width
            node_width = @node_width

            # If nodes would overlap, then overflow the domain
            if @overflow_width_ratio
                if (node_width * (@h.domain()[1]+1) / @width) > @overflow_width_ratio
                    @h.domain [0, (@overflow_width_ratio*@width/node_width)-1]

        else if @node_width.charAt?(@node_width.length-1) is '%'
            node_percent = (@node_width[..-2]/100)
            node_width = (node_percent*@width) / (@columns.length+node_percent-1)

        else throw new Error "Unsupported node_width parameter: "+@node_width

        # Set the horizontal range here in case @node_width is a percentage
        @h.rangeRound [0, @width-node_width]

        # Position the nodes
        @node_g.animate(origin isnt 'render' and origin isnt 'resize').position
            transform: (d)=> 'translate('+@h(@nodes[key=@key d].x)+','+@v(@nodes[key].y)+')'
        @rects.animate(origin isnt 'render' and origin isnt 'resize').position
            width: node_width
            height: (d)=> Math.max 1, @v @nodes[@key d].value

        # Position the links
        @paths.animate(origin isnt 'render' and origin isnt 'resize').position
            d: (link)=>
                node_link = @node_links[@link_key link]
                sx = @h(node_link.sx) + node_width
                tx = @h(node_link.tx)
                switch @link_path
                    when 'straight'
                        sy = @v node_link.sy
                        ty = @v node_link.ty
                        'M'+sx+','+sy+
                        'L'+tx+','+ty+
                        'l0,'+@v(node_link.value)+
                        'L'+sx+','+(sy+@v(node_link.value))+'Z'
                    when 'curve'
                        # Curves always exit right side of the node and enter the left side
                        curvature = if tx>sx then @link_path_curvature else -@link_path_curvature*4
                        sy = @v(node_link.sy + node_link.value/2)
                        ty = @v(node_link.ty + node_link.value/2)
                        x_interpolator = d3.interpolateRound sx, tx
                        'M'+sx+','+sy+ # Start of curve
                        'C'+x_interpolator(curvature)+','+sy+ # First control point
                        ' '+x_interpolator(1-curvature)+','+ty+ # Second control point
                        ' '+tx+','+ty
                    else throw Error "Unknown link_path option: "+@link_path
            'stroke-width': if @link_path is 'curve' then (link)=> Math.max 1, @v @node_links[@link_key link].value

        @links_layer.all.attr 'class', 'links '+@link_path

        # Position the node labels
        # TODO: optimize to avoid `all.style` overhead for each node.
        if @node_labels?
            if @node_label_options.orientation isnt 'vertical'
                # Left alight horizontal labels on the left and right align them on the right
                @node_labels.animate(origin isnt 'render' and origin isnt 'resize').position
                    y: (d)=> @v(@nodes[@key d].value) / 2
                    x: (d)=> if @nodes[@key d].x > @h.domain()[1]/2 then node_width else 0
                    dx: (d)=> if @nodes[@key d].x > @h.domain()[1]/2 then '-0.25em' else '0.25em'
                    dy: '0.4em'
                @nodes_layer.all.classed
                    'horizontal_labels': true
                    'vertical_labels': false
                @node_labels.all.style
                    'text-anchor': (d)=> if @nodes[@key d].x > @h.domain()[1]/2 then 'end' else 'start'
            else
                @node_labels.animate(origin isnt 'render' and origin isnt 'resize').position
                    y: node_width / 2
                    x: (d)=> -@v @nodes[@key d].value
                    dx: '0.25em'
                    dy: '0.4em'
                @nodes_layer.all.classed
                    'horizontal_labels': false
                    'vertical_labels': true
                @node_labels.all.style
                    'text-anchor': 'start'


    _style: (style_new)=>
        # Apply options here in case the user updated them between restyle()'s
        @node_g.options @node_options
        @rects.options @rect_options
        @node_labels?.options @node_label_options
        @link_g.options @link_options
        @paths.options @path_options

        @nodes_layer.style()
        @node_g.style style_new
        @rects.style style_new
        @node_labels?.style style_new
        @links_layer.style()
        @link_g.style style_new
        @paths.style style_new
        #@link_labels?.style style_new


###################################################################
# Butterfly
###################################################################

# Butterfly flow visualization.
#
# This represents a {c3.Sankey Sankey Flow Graph} that can have a _focal_ node.
# The focal node is rendered in the middle and the nodes following
# into it are rendered on the left and the nodes flowing out of it are rendered
# on the right.  The user can select a new node to be the _focal_ by clicking
# on it.  Only the `depth_of_field` levels of input and output nodes are
# rendered to keep the graph comprehensible for large graphs.
#
# @author Douglas Armstrong
# @todo Position nodes that are on both the right and left wings in the middle?
# @todo If nodes are called by the focal node as well as other nodes, ensure
#   that they are positioned in a column based on their depth from the focal.
class c3.Sankey.Butterfly extends c3.Sankey
    @version: 0.1
    type: 'butterfly'

    # [Boolean] Enable or disable user navigation of nodes
    navigatable: true
    # [Number] Number of levels of nodes to visualize to the left and right of the focus node
    depth_of_field: 2

    _init: =>
        super
        @background.new.on 'click', => @focus null

    _update: (origin)=>
        if @focal not in @data then @focal = null

        if @focal?
            @_update_data(origin) if origin isnt 'focus'
            @_butterfly_layout()
        else
            super

        if @navigatable
            @rects.new.on 'click', (datum)=>
                d3.event.stopPropagation
                @focus datum

        @_style true

    _butterfly_layout: =>
        focus_key = @key @focal
        focus_node = @nodes[focus_key]

        # Find all neighboring nodes within the depth_of_field distance and layout their x value
        # TODO: Use breadth-first instead of depth-first to get distance to focal node correct.
        @current_nodes = {}
        walk = (key, direction, depth)=>
            if @current_nodes[key] then return # If we already visited this node, then stop walking this path
            node = @nodes[key]
            if not node? then return # If this node is missing, then don't walk to it
            @current_nodes[key] = node # Record node as visited
            node.x = @depth_of_field + (depth*direction)
            # If we are still in the depth of field, then continue walking in the same direction
            if depth < @depth_of_field
                for link in (if direction is 1 then node.target_links else node.source_links)
                    walk (if direction is 1 then @link_target else @link_source)(link), direction, depth+1
        # First walk to the right finding nodes, then the left
        walk focus_key, 1, 0
        delete @current_nodes[focus_key] # Remove so we can start again from the focal node when walking left
        walk focus_key, -1, 0

        @h.domain [-0.5, @depth_of_field*2 + 0.5]

        @_layout 'focus'

    _style: (style_new)=>
        super
        @content.all.classed 'navigatable', @navigatable
        @node_g.all.classed 'focal', (datum)=> datum is @focal

    # Focus visualization on a specified **focus** node.
    # The graph will then fan out to the left and right of the focal node by `depth_of_field` levels.
    focus: (focal)=>
        if focal isnt @focal
            @focal = focal
            @trigger 'focus', @focal
            @_update 'focus'
            @_draw 'focus'
            @trigger 'focusend', @focal
        return this

c3.Butterfly = c3.Sankey.Butterfly
