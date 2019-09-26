import { isNil } from 'lodash';
import { SwaggerEnumType } from '../types/swagger-enum.type';
import { createParamDecorator } from './helpers';

const initialMetadata = {
  name: '',
  required: true
};

const getCollectionFormatOrDefault = (
  metadata: Record<string, any>,
  defaultValue: string
) =>
  isNil(metadata.collectionFormat) ? defaultValue : metadata.collectionFormat;

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

  if (metadata.isArray) {
    param.type = Array;
    if (metadata.enum) {
      param.items = {
        type: 'string',
        enum: metadata.enum
      };
      param.collectionFormat = getCollectionFormatOrDefault(metadata, 'multi');
    } else {
      param.collectionFormat = getCollectionFormatOrDefault(metadata, 'csv');
      param.items = {
        type: metadata.type
      };
    }
  } else if (metadata.enum) {
    param.type = String;
    param.enum = metadata.enum;
  }

  return createParamDecorator(param, initialMetadata);
};
