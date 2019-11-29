import { isString } from '@nestjs/common/utils/shared.utils';

export interface PluginOptions {
  dtoFileNameSuffix?: string | string[];
  controllerFileNameSuffix?: string | string[];
  classValidatorShim?: boolean;
}

const defaultOptions: PluginOptions = {
  dtoFileNameSuffix: ['.dto.ts', '.entity.ts'],
  controllerFileNameSuffix: ['.controller.ts'],
  classValidatorShim: true
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
