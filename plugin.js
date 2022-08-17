'use strict';
function __export(m) {
  for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
exports.__esModule = true;
const plugin = require('./dist/plugin');
__export(plugin);

/** Compatibility with ts-patch/ttypescript */
exports.default = (program, options) => plugin.before(options, program);
