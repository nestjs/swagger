import { createParamDecorator } from './helpers';

interface ApiMultipartMetadata {
  name: string;
}

export type ApiMultipartOptions = {
  binaryFiles: ApiMultipartMetadata[];
};

const defaultBodyMetadata: ApiMultipartMetadata = {
  name: ''
};

export function ApiMultipart(options: ApiMultipartOptions): MethodDecorator {
  if (!options || !options.binaryFiles || !options.binaryFiles.length) {
    return;
  }

  const param: Record<string, any> = {
    in: 'body',
    required: true,
    schema: {
      type: 'object',
      properties: {}
    },
    type: 'multipart/form-data',
    isArray: false
  };

  options.binaryFiles.forEach(file => {
    param.schema.properties[file.name] = {
      type: 'string',
      format: 'binary'
    };
  });

  return createParamDecorator(param, defaultBodyMetadata);
}
