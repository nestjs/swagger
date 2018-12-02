import { isNil } from 'lodash';
import { createParamDecorator } from './helpers';
import { SwaggerEnumType } from '../types/swagger-enum.type';
import { SwaggerTypeDataFormat } from '../types/swagger-type-data-format';
import { SwaggerTypeDataType } from '../types/swagger-type-data-type';

const initialMetadata = {
  name: '',
  required: true
};

export const ApiImplicitQuery = (metadata: {
  name: string;
  description?: string;
  required?: boolean;
  type?: SwaggerTypeDataType;
  format?: SwaggerTypeDataFormat;
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
    format: metadata.format,
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
