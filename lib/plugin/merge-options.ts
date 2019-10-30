export interface PluginOptions {
  dtoFileNameSuffix?: string;
  controllerFileNameSuffix?: string;
  classValidatorShim?: boolean;
}

const defaultOptions: PluginOptions = {
  dtoFileNameSuffix: '.dto.ts',
  controllerFileNameSuffix: '.controller.ts',
  classValidatorShim: false
};

export const mergePluginOptions = (
  options: Record<string, any> = {}
): PluginOptions => ({
  ...defaultOptions,
  ...options
});
