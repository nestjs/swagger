"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginDebugLogger = void 0;
const common_1 = require("@nestjs/common");
class PluginDebugLogger extends common_1.ConsoleLogger {
}
exports.pluginDebugLogger = new PluginDebugLogger('CLI Plugin');
