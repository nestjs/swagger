import { isString } from '@nestjs/common/utils/shared.utils';
import { pluginDebugLogger } from './plugin-debug-logger';

export interface PluginOptions {
  dtoFileNameSuffix?: string | string[];
  controllerFileNameSuffix?: string | string[];
  classValidatorShim?: boolean;
  classTransformerShim?: boolean | 'exclusive';
  dtoKeyOfComment?: string;
  controllerKeyOfComment?: string;
  introspectComments?: boolean;
  esmCompatible?: boolean;
  readonly?: boolean;
  pathToSource?: string;
  debug?: boolean;
  parameterProperties?: boolean;
  /**
   * Skip auto-annotating controller methods with HTTP status codes (e.g., @HttpCode(201))
   */
  skipAutoHttpCode?: boolean;
  /**
   * Skip add default for properties that do not specify default values.
   */
  skipDefaultValues?: boolean;
}

const defaultOptions: PluginOptions = {
  dtoFileNameSuffix: ['.dto.ts', '.entity.ts'],
  controllerFileNameSuffix: ['.controller.ts'],
  classValidatorShim: true,
  classTransformerShim: false,
  dtoKeyOfComment: 'description',
  controllerKeyOfComment: 'summary',
  introspectComments: false,
  esmCompatible: false,
  readonly: false,
  debug: false,
  skipDefaultValues: false
};

export const mergePluginOptions = (
  options: Record<string, any> = {}
): PluginOptions => {
  if (isString(options.dtoFileNameSuffix)) {
    options.dtoFileNameSuffix = [options.dtoFileNameSuffix];
  }
  if (isString(options.controllerFileNameSuffix)) {
    options.controllerFileNameSuffix = [options.controllerFileNameSuffix];
  }
  for (const key of ['dtoFileNameSuffix', 'controllerFileNameSuffix']) {
    if (options[key] && options[key].includes('.ts')) {
      pluginDebugLogger.warn(
        `Skipping ${key} option ".ts" because it can cause unwanted behaviour.`
      );
      options[key] = options[key].filter((pattern) => pattern !== '.ts');
      if (options[key].length == 0) {
        delete options[key];
      }
    }
  }
  return {
    ...defaultOptions,
    ...options
  };
};
