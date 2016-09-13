// Temporary hack to allow C3 usage from NPM package "Q3"
// TODO: Cleanup for proper module and require usage.
// TODO: Rename pending to avoid conflict with existing C3 package.
c3 = require('./c3.js');
require('./c3-table.js');
require('./c3-plot.js');
require('./c3-layers.js');
require('./c3-legend.js');
require('./c3-polar.js');
require('./c3-graph.js');
module.exports = c3;
