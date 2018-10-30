import { isNil } from 'lodash';
import { createParamDecorator } from './helpers';
import { SwaggerEnumType } from '../types/swagger-enum.type';

const initialMetadata = {
  name: '',
  required: true
};

export const ApiImplicitParam = (metadata: {
  name: string;
  description?: string;
  required?: boolean;
  enum?: SwaggerEnumType;
  type?: 'String' | 'Number' | 'Boolean' | any;
}): MethodDecorator => {
  const param = {
    name: isNil(metadata.name) ? initialMetadata.name : metadata.name,
    in: 'path',
    description: metadata.description,
    required: metadata.required,
    type: metadata.type,
    enum: undefined
  };

  if (metadata.enum) {
    param.type = String;
    param.enum = metadata.enum;
  }

  return createParamDecorator(param, initialMetadata);
};
