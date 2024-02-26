import { isString } from '@nestjs/common/utils/shared.utils';

export interface PluginOptions {
  dtoFileNameSuffix?: string | string[];
  controllerFileNameSuffix?: string | string[];
  classValidatorShim?: boolean;
  classTransformerShim?: boolean | 'exclusive';
  dtoKeyOfComment?: string;
  controllerKeyOfComment?: string;
  introspectComments?: boolean;
  readonly?: boolean;
  pathToSource?: string;
  debug?: boolean;
  parameterProperties?: boolean;
}

const defaultOptions: PluginOptions = {
  dtoFileNameSuffix: ['.dto.ts', '.entity.ts'],
  controllerFileNameSuffix: ['.controller.ts'],
  classValidatorShim: true,
  classTransformerShim: false,
  dtoKeyOfComment: 'description',
  controllerKeyOfComment: 'description',
  introspectComments: false,
  readonly: false,
  debug: false
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
  return {
    ...defaultOptions,
    ...options
  };
};
