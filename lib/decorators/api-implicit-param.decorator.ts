import { isNil } from 'lodash';
import { ApiBaseMetadata } from '../types/api-base-metadata';
import { SwaggerEnumType } from '../types/swagger-enum.type';
import { createParamDecorator } from './helpers';

const initialMetadata = {
  name: '',
  required: true
};

export interface ApiImplicitParamMetadata extends ApiBaseMetadata {
  enum?: SwaggerEnumType;
  type?: 'String' | 'Number' | 'Boolean' | any;
}


export const ApiImplicitParam = (metadata: ApiImplicitParamMetadata): MethodDecorator => {
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
