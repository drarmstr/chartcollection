# C3 Visualization Library
# Graphs

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
# to adjust the layout algorithm.
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
# * Tweaked layout algorithm.
#
# Features that are planned:
#
# * Labels
# * Links to missing nodes
# * Draggable nodes
# * Zoom/pan navigation
# @author Douglas Armstrong
# @todo Labels
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
    
    _size: =>
        # The horizontal scale range is set in _draw() in case the @node_width is a percentage
        @v.range [0, @height]
        
        # If we are resizing, need to call _update() if @node_padding is based on a pixel size
        if !isNaN @node_padding then @_update()
    
    _update: (origin)=>
        # The first render() calls _size() which might call us.  If so, then don't repeat the work.
        if origin is 'render' and !isNaN @node_padding then return
        
        # Collect the set of nodes and their links, cache the link values
        @nodes = nodes = {}
        @node_links = node_links = {}
        current_links = []
        for link in @links
            link_key = @link_key link
            link_value = @link_value link
            if not link_value then continue
            if node_links[link_key]? then throw Error "Link with duplicate source and target specified"
            current_links.push link
            node_links[link_key] = { value: @link_value(link) }
            
            # Prepare set of nodes and their interconnected links
            node = nodes[@link_source link] ?= { source_links: [], target_links: [] }
            node.target_links.push link
            node = nodes[@link_target link] ?= { source_links: [], target_links: [] }
            node.source_links.push link
        
        # Gather just the set of nodes that are linked to
        current_data = (datum for datum in @data when @key(datum) of @nodes)
        
        # Compute the value for each node
        if @value?
            nodes[@key datum].value = @value(datum) for datum in current_data
        else
            key = @key
            link_key = @link_key
            for datum in current_data
                node = nodes[key datum]
                node.value = Math.max(
                    d3.sum(node.source_links, (l)-> node_links[link_key l].value),
                    d3.sum(node.target_links, (l)-> node_links[link_key l].value) )
        for key,node of nodes when not node.value?
            throw Error "Missing nodes are not currently supported"
        
        # Pre-compute the sums of link values  BLARG only do once, not per iteration
        for key, node of @nodes
            node.links_sum = 
                d3.sum(node.source_links, (l)=> @node_links[@link_key l].value) +
                d3.sum(node.target_links, (l)=> @node_links[@link_key l].value)
        
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
                    target = nodes[target_key]
                    node_links[@link_key link].backedge = target in stack
                    if not visited[target_key] then detect_backedge target_key, target
                stack.pop()
            )(key, node)
        
        # Compute the x position of each node
        remaining_nodes = @nodes
        x = 0
        while not c3.util.isEmpty remaining_nodes
            next_nodes = {}
            for key, node of remaining_nodes
                node.x = x;
                for link in node.target_links when not node_links[@link_key link].backedge
                    target_key = @link_target link
                    next_nodes[target_key] = nodes[target_key]
            remaining_nodes = next_nodes
            x++
        
        # Right align nodes with no targets
        x--
        if @align is 'both'
            for key, node of @nodes
                if not node.target_links.length then node.x = x
        
        # Compute horizontal domain
        @h.domain [0,x]
        
        @_layout origin, current_data, current_links
    
    
    _layout: (origin, current_data, current_links)=>
        nodes = @nodes
        node_links = @node_links
        
        # Prepare set of columns
        @columns = columns = d3.nest()
            .key (node)-> node.x
            .sortKeys d3.ascending
            #.sortValues d3.descending
            .entries (node for key,node of @nodes)
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
            for node in (@nodes[@key datum] for datum in current_data)
                c3.array.sort_up node.source_links, (link)-> nodes[link_source link].y
                y = node.y
                for link in node.source_links
                    node_link = node_links[link_key link]
                    node_link.ty = y
                    y += node_link.value
                
                c3.array.sort_up node.target_links, (link)-> nodes[link_target link].y
                y = node.y
                for link in node.target_links
                    node_link = node_links[link_key link]
                    node_link.sy = y
                    y += node_link.value

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
                y += node.value + column.padding
        for column,j in columns when j
            # For each subsequent column, align the nodes to the right of their sources to attempt flatter links
            for node in column
                weighted_y = 0
                source_link_value = 0
                for link in node.source_links
                    link_key = @link_key link
                    node_link = @node_links[link_key]
                    if node_link.backedge then continue
                    weighted_y += nodes[@link_source link].y * node_link.value
                    source_link_value += node_link.value
                node.y = weighted_y / source_link_value
        ## Give nodes and links an initial position
        #for column in columns
        #     node.y = i for node,i in column
        collision_detection()
        layout_links()

        # Shift nodes closer to their neighbors based on the value of their links
        # Iterate back and forth across the nodes left and right.
        alpha = 1
        for iteration in [0...@iterations]
            alpha *= @alpha

            for column in columns
                for node in column
                    delta = 0
                    for link in node.source_links
                        node_link = @node_links[@link_key link]
                        if not node_link.backedge
                            delta += (node_link.sy - node_link.ty) * node_link.value #* (0.5+(1/(2*Math.abs(node.x-@nodes[@link_source link].x))))
                    for link in node.target_links
                        node_link = @node_links[@link_key link]
                        if not node_link.backedge
                            delta += (node_link.ty - node_link.sy) * node_link.value #* (0.5+(1/(2*Math.abs(node.x-@nodes[@link_target link].x))))
                    delta /= node.links_sum
                    node.y += delta * alpha
            collision_detection()
            layout_links()
        
        # Bind data to the DOM
        @nodes_layer = @content.select('g.nodes').singleton().options(@nodes_options).update()
        @node_g = @nodes_layer.select('g.node').options(@node_options).animate(origin isnt 'render')
            .bind(current_data,@key).update()
        @rects = @node_g.inherit('rect').options(@rect_options).update()
        
        @links_layer = @content.select('g.links',':first-child').singleton().options(@links_options).update()
        @link_g = @links_layer.select('g.link').options(@link_options).animate(origin isnt 'render')
            .bind(current_links,@link_key).update()
        @paths = @link_g.inherit('path').options(@path_options).update()
        @link_g.all.classed 'backedge', (link)=> @node_links[@link_key link].backedge
        
        
    _draw: (origin)=>
        # Calculate node_width in pixels
        if !isNaN @node_width
            node_width = @node_width
        else if @node_width.charAt?(@node_width.length-1) is '%'
            node_percent = (@node_width[..-2]/100)
            node_width = (node_percent*@width) / (@columns.length+node_percent-1)
        else throw new Error "Unsupported node_width parameter: "+@node_width
        
        # Set the horizontal range here in case @node_width is a percentage
        @h.rangeRound [0, @width-node_width]
        
        @rects.animate(origin isnt 'render' and origin isnt 'resize').position
            x: (d)=> @h @nodes[@key d].x
            y: (d)=> @v @nodes[@key d].y
            width: node_width
            height: (d)=> Math.max 1, @v @nodes[@key d].value
        
        @paths.animate(origin isnt 'render' and origin isnt 'resize').position
            d: (link)=>
                node_link = @node_links[@link_key link]
                source_node = @nodes[@link_source link]
                target_node = @nodes[@link_target link]
                sx = @h(source_node.x) + node_width
                tx = @h(target_node.x)
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
    
    _style: (style_new)=>
        # Apply options here in case the user updated them between restyle()'s
        @node_g.options @node_options
        @rects.options @rect_options
        @link_g.options @link_options
        @paths.options @path_options
        
        @nodes_layer.style()
        @node_g.style style_new
        @rects.style style_new
        #@node_labels.style style_new
        @links_layer.style()
        @link_g.style style_new
        @paths.style style_new
        #@link_labels.style style_new


###################################################################
# Butterfly
###################################################################

# Butterfly flow visualization.
# **This is a work in progress.**
# @author Douglas Armstrong
class c3.Butterfly extends c3.Sankey
    @version: 0.1
    type: 'butterfly'
    
    navigatable: true
    depth_of_field: 2
    
    _update: (origin)=>
        super
        @_butterfly_update()
        
    _butterfly_update: =>
        if (@navigatable)
            @rects.new.on 'click', (datum)=> @focus datum
    
    _style: (style_new)=>
        super
        @content.all.classed 'navigatable', @navigatable
    
    focus: (focus)=>
        console.debug focus # BLARG
        
        focus_key = @key focus
        focus_node = @nodes[focus_key]
        nodes = {}
        nodes[focus_key] = focus_node
        current_links = []
        walk = (key, direction, depth)=>
            node = nodes[key] = @nodes[key]
            node.x = @depth_of_field + (depth*direction)
            for links in [node.source_links, node.target_links]
                for link in links
                    current_links.push link
            if depth < @depth_of_field
                for link in (if direction is 1 then node.target_links else node.source_links)
                    walk (if direction is 1 then @link_target else @link_source)(link), direction, depth+1
        walk focus_key, 1, 0
        walk focus_key, -1, 0
        
        current_data = (datum for datum in @data when @key(datum) of nodes)
        
        @h.domain [0,@depth_of_field*2]
        
        @_layout 'focus', current_data, current_links
        @_butterfly_update()
        @_draw 'focus'
        @_style true
