import { DECORATORS } from '../constants';
import { SwaggerEnumType } from '../types/swagger-enum.type';
import { createMethodDecorator, createParamDecorator } from './helpers';
import { omit, pickBy, negate, isUndefined, isNil } from 'lodash';

const initialMetadata = {
  name: '',
  required: true
};

export const ApiImplicitQuery = (metadata: {
  name: string;
  description?: string;
  required?: boolean;
  type?: 'String' | 'Number' | 'Boolean' | any;
  isArray?: boolean;
  enum?: SwaggerEnumType;
  collectionFormat?: 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi';
}): MethodDecorator => {
  const param = {
    name: isNil(metadata.name) ? initialMetadata.name : metadata.name,
    in: 'query',
    description: metadata.description,
    required: metadata.required,
    type: metadata.type,
    enum: undefined,
    items: undefined,
    collectionFormat: undefined
  };

  if (metadata.enum) {
    param.type = String;
    param.enum = metadata.enum;
  }

  if (metadata.isArray) {
    param.type = Array;
    if (metadata.enum) {
      param.items = {
        type: 'String',
        enum: metadata.enum
      };
      param.collectionFormat = 'multi';
      param.enum = undefined;
    } else {
      param.items = {
        type: metadata.type
      };
      param.collectionFormat = isNil(metadata.collectionFormat)
        ? 'csv'
        : metadata.collectionFormat;
    }
  }
  return createParamDecorator(param, initialMetadata);
};
