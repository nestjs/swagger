import { ConsoleLogger } from '@nestjs/common';

class PluginDebugLogger extends ConsoleLogger {}

export const pluginDebugLogger = new PluginDebugLogger('CLI Plugin');
