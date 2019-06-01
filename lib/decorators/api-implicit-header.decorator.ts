import { isNil } from 'lodash';
import { createMultipleParamDecorator, createParamDecorator } from './helpers';
import { ApiBaseMetadata } from '../types/api-base-metadata';

const initialMetadata = {
  name: '',
  required: true
};

export const ApiImplicitHeader = (
  metadata: ApiBaseMetadata
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
  headers: ApiBaseMetadata[]
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
