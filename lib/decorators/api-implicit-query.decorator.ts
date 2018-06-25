import { DECORATORS } from '../constants';
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
  collectionFormat?: 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi';
}): MethodDecorator => {
  const param = {
    name: isNil(metadata.name) ? initialMetadata.name : metadata.name,
    in: 'query',
    description: metadata.description,
    required: metadata.required,
    type: metadata.type,
    items: undefined,
    collectionFormat: undefined
  };
  if (metadata.isArray) {
    param.type = Array;
    param.items = {
      type: metadata.type
    };
    param.collectionFormat = isNil(metadata.collectionFormat)
      ? 'csv'
      : metadata.collectionFormat;
  }
  return createParamDecorator(param, initialMetadata);
};
