import { isNil } from 'lodash';
import {
  createMultipleParamDecorator,
  createParamDecorator,
  createClassDecorator
} from './helpers';
import { DECORATORS } from '../constants';

const initialMetadata = {
  name: '',
  required: true
};

export interface HeaderMetadata {
  name: string;
  description?: string;
  required?: boolean;
}

export const ApiImplicitClassHeader = (metadata: HeaderMetadata) => {
  const params = {
    ...metadata,
    in: 'header',
    type: 'string'
  };

  return createClassDecorator(DECORATORS.API_HEADER, params);
};

export const ApiImplicitHeader = (
  metadata: HeaderMetadata
): MethodDecorator => {
  const param = {
    name: isNil(metadata.name) ? initialMetadata.name : metadata.name,
    in: 'header',
    description: metadata.description,
    required: metadata.required,
    type: String
  };
  return createParamDecorator(param, initialMetadata);
};

export const ApiImplicitHeaders = (
  headers: Array<HeaderMetadata>
): MethodDecorator => {
  const multiMetadata = headers.map(metadata => ({
    name: isNil(metadata.name) ? initialMetadata.name : metadata.name,
    in: 'header',
    description: metadata.description,
    required: metadata.required,
    type: String
  }));
  return createMultipleParamDecorator(multiMetadata, initialMetadata);
};
