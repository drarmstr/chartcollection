# C3 Visualization Library
# Graphs

###################################################################
# Graph
###################################################################

class c3.Graph extends c3.Chart
    @version: 0.1
    type: 'graph'


###################################################################
# Sankey
###################################################################

# Directed Graph
# Unlike D3 Sankey
## Does not modify provided dataset
## Animate changing datasets
## Provide accessors for working with custom data types
## Allows nodes to have a value larger then the incoming and outgoing links
## Padding and node widths in terms of pixels or percentage
## Cycles/Back Edges allowed
## Links to missing nodes
## Tweaked layout algorithm
## Zoom and Pan
## Draggable nodes horizontally as well as vertically

class c3.Sankey extends c3.Graph
    @version: 0.1
    type: 'sankey'
    
    data: []
    links: []
    key: undefined
    value: undefined
    link_source: undefined
    link_target: undefined
    link_value: undefined
    
    iterations: 32
    alpha: 0.99
    node_padding: '20%'
    node_width: 30
    align: 'both'
    link_path: 'curve'
    # From 0-1
    link_path_curvature: 0.5
    
    nodes_options: undefined
    node_options: undefined
    rect_options: undefined
    links_options: undefined
    link_options: undefined
    path_options: undefined
    node_label_options: undefined
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
#            .sortValues d3.descending
            .entries (node for key,node of @nodes)
            .map (g)-> g.values
        c3.array.sort_up @columns, (column)-> column[0].x # d3's sortKeys didn't work?
#        for column in columns
#            c3.array.sort_up column, (node)-> node.value

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

#                for node, i in column
#                    overlap = y - node.y
#                    if overlap > 0
#                        if i
#                            #move_up = overlap * (node.links_sum / (node.links_sum+column[i-1].links_sum))
#                            #move_down = overlap * (column[i-1].links_sum / (node.links_sum+column[i-1].links_sum))
#                            move_up = move_down = overlap / 2
#                        else 
#                            move_up = 0
#                            move_down = overlap
#                        
#                        j=i-1
#                        while j >= 0 and move_up > 1e-11
#                            column[j].y -= move_up
#                            if not j then break
#                            move_up = column[j].y - column[j-1].y + column[j-1].value + column.padding
#                        
#                        node.y += move_down
#                    y = node.y + node.value + column.padding
                
                # If they extend past the bottom, then push some back up
                if node.y+node.value > @v.domain()[1]
                    y = @v.domain()[1] 
                    for node in column by -1
                        dy = node.y + node.value - y
                        if dy > 0 then node.y -= dy
                        else break
                        y = node.y - column.padding
                
#                # If they extend past the top, then push some back down
#                c3.array.sort_up column, (node)-> node.y
#                y = 0
#                for node in column
#                    overlap = y - node.y
#                    if overlap > 0 then node.y += overlap
#                    else break
#                    y = node.y + node.value + column.padding
                        
        
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
                if isNaN y then throw "BLARG"
#            # For the first column, place by ordinal to make it easier for first iteration to re-order
#            node.y = i for node,i in columns[0]
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
        collision_detection()

#        # Give nodes and links an initial position
#        for column in columns
##            node.y = i for node,i in column
#            y = 0
#            for node in column
#                node.y = y
#                y += node.value + column.padding
##        collision_detection()

        layout_links()

        # Shift nodes closer to their neighbors based on the value of their links
        # Iterate back and forth across the nodes left and right.
        alpha = 1
        for iteration in [0...@iterations]
            alpha *= @alpha # BLARG 0.99
            
            # Pre-compute the sums of link values  BLARG only do once, not per iteration
            for key, node of @nodes
                node.links_sum = 
                    d3.sum(node.source_links, (l)=> @node_links[@link_key l].value) +
                    d3.sum(node.target_links, (l)=> @node_links[@link_key l].value)

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

#            for column in columns
#                for node in column
#                    y = 0
#                    if node.source_links.length
#                        y += d3.sum(node.source_links, (link)=>
#                            link_value = @link_value link
#                            (@node_links[@link_key link].sy + link_value/2) * link_value )
#                    if node.target_links.length
#                        y += d3.sum(node.target_links, (link)=>
#                            link_value = @link_value link
#                            (@node_links[@link_key link].ty + link_value/2) * link_value )
#                    y /= node.links_sum
#                    node.y += (y - (node.y+node.value/2)) * alpha
#            collision_detection()
#            layout_links()
                                    
#            for column in columns
#                for node in column
#                    y = 0
#                    if node.source_links.length
#                        y += d3.sum(node.source_links, (link)=>
#                                source_node = @nodes[@link_source link]
#                                (source_node.y+source_node.value/2) * @link_value(link) )
#                    if node.target_links.length
#                        y += d3.sum(node.target_links, (link)=>
#                                target_node = @nodes[@link_target link]
#                                (target_node.y+target_node.value/2) * @link_value(link) )
#                    y /= node.links_sum
#                    node.y += (y - (node.y+node.value/2)) * alpha
#            collision_detection()

#            # Pre-compute the sums of link values
#            for key, node of @nodes
#                node.source_links_sum = d3.sum node.source_links, @link_value
#                node.target_links_sum = d3.sum node.target_links, @link_value
#                
#            # Iterate right -> left
#            for column in columns by -1
#                for node in column
#                    if node.source_links.length
#                        y = d3.sum(node.source_links, (link)=>
#                                source_node = @nodes[@link_source link]
#                                (source_node.y+source_node.value/2) * @link_value(link) ) / \
#                            node.source_links_sum
#                        node.y += (y - (node.y+node.value/2)) * alpha
##            collision_detection()
#
#            # Iterate left -> right
#            for column in columns
#                for node in column
#                    if node.target_links.length
#                        y = d3.sum(node.target_links, (link)=>
#                                target_node = @nodes[@link_target link]
#                                (target_node.y+target_node.value/2) * @link_value(link) ) / \
#                            node.target_links_sum
#                        node.y += (y - (node.y+node.value/2)) * alpha
#            collision_detection()
        
        #collision_detection()
        
        
#        # Layout the links along the nodes
#        @node_links = {}
#        @node_links[@link_key link] = {} for link in @links
#        for node in (@nodes[@key datum] for datum in current_data)
#            c3.array.sort_up node.source_links, (link)=> @nodes[@link_source link].y
#            y = node.y
#            for link in node.source_links
#                @node_links[@link_key link].ty = y
#                y += @link_value link
#                
#            c3.array.sort_up node.target_links, (link)=> @nodes[@link_target link].y
#            y = node.y
#            for link in node.target_links
#                @node_links[@link_key link].sy = y
#                y += @link_value link
        
        
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
    
#        @node_g.animate(origin is 'redraw').position
#            'transform': (d,i)=> 'translate('+@h((node=@nodes[@key d]).x)+','+@v(node.y)+')'
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
