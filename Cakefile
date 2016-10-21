fs = require 'fs'

{print} = require 'sys'
{spawn, exec} = require 'child_process'

call = (cmd, args...)->
	cmd += ' '+args.join(' ')
	console.log "> "+cmd
	child = exec cmd, (error, stdout, stderr)->
		if error then console.log error
		console.log stdout
		console.log stderr
	### The following does not port well to Windows which requires the command to be "cmd /c ..."
	child = spawn cmd, args
	child.stderr.on 'data', (data)-> process.stderr.write data.toString()
	child.stdout.on 'data', (data)-> print data.toString()
	child.on 'exit', (code)-> if code then console.log "Exit code: "+code
	child.on 'error', (err)-> console.log err
	return child
	###

# @todo Setup a LESS compiler
task 'build', "Build C4", ->
	call 'coffee -c -m -o js js'

task 'watch', "Watch for changes", ->
	call 'coffee -w -c -m -o js js'

task 'examples', "Build Exampels", ->
	call 'tsc'

task 'doc', "Build Example Documentation", ->
	# Generate C4 API documentation into the doc folder
	call 'node_modules/codo/bin/codo -t "C3 Documentation" -o doc js'

	# Generate annotated source documentation for the examples
	examples = fs.readdirSync 'examples'
	examples = ("examples/"+filename for filename in examples when filename[-3..] is '.ts')
	call 'node_modules/docco/bin/docco -l parallel -o examples/doc', examples...

task 'all', "Build All", ->
	invoke 'build'
	invoke 'examples'
	invoke 'doc'
