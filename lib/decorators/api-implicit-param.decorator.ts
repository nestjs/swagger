import { isNil } from 'lodash';
import { createParamDecorator } from './helpers';
import { SwaggerTypeDataFormat } from '../types/swagger-type-data-format';
import { SwaggerTypeDataType } from '../types/swagger-type-data-type';

const initialMetadata = {
  name: '',
  required: true
};

export const ApiImplicitParam = (metadata: {
  name: string;
  description?: string;
  required?: boolean;
  type?: SwaggerTypeDataType;
  format?: SwaggerTypeDataFormat;
}): MethodDecorator => {
  const param = {
    name: isNil(metadata.name) ? initialMetadata.name : metadata.name,
    in: 'path',
    description: metadata.description,
    required: metadata.required,
    type: metadata.type,
    format: metadata.format
  };
  return createParamDecorator(param, initialMetadata);
};
