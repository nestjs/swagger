export const createCliPluginMultiOption = {
  dtoFileNameSuffix: ['.ts', '.dto.ts'],
  introspectComments: true
};

export const createCliPluginSingleOption = {
  dtoFileNameSuffix: ['.ts'],
  introspectComments: true
};

export const mergedCliPluginMultiOption = {
  dtoFileNameSuffix: ['.dto.ts'],
  controllerFileNameSuffix: ['.controller.ts'],
  classValidatorShim: true,
  classTransformerShim: false,
  dtoKeyOfComment: 'description',
  controllerKeyOfComment: 'summary',
  introspectComments: true,
  esmCompatible: false,
  readonly: false,
  debug: false,
  skipDefaultValues: false
};

export const mergedCliPluginSingleOption = {
  dtoFileNameSuffix: ['.dto.ts', '.entity.ts'],
  controllerFileNameSuffix: ['.controller.ts'],
  classValidatorShim: true,
  classTransformerShim: false,
  dtoKeyOfComment: 'description',
  controllerKeyOfComment: 'summary',
  introspectComments: true,
  esmCompatible: false,
  readonly: false,
  debug: false,
  skipDefaultValues: false
};
