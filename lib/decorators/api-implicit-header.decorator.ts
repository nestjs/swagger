import { DECORATORS } from '../constants';
import {
  createMethodDecorator,
  createParamDecorator,
  createMultipleParamDecorator,
} from './helpers';
import { omit, pickBy, negate, isUndefined, isNil } from 'lodash';

const initialMetadata = {
  name: '',
  required: true,
};

export const ApiImplicitHeader = (metadata: {
  name: string;
  description?: string;
  required?: boolean;
}): MethodDecorator => {
  const param = {
    name: isNil(metadata.name) ? initialMetadata.name : metadata.name,
    in: 'header',
    description: metadata.description,
    required: metadata.required,
    type: String,
  };
  return createParamDecorator(param, initialMetadata);
};

export const ApiImplicitHeaders = (
  headers: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>,
): MethodDecorator => {
  const multiMetadata = headers.map(metadata => ({
    name: isNil(metadata.name) ? initialMetadata.name : metadata.name,
    in: 'header',
    description: metadata.description,
    required: metadata.required,
    type: String,
  }));
  return createMultipleParamDecorator(multiMetadata, initialMetadata);
};
