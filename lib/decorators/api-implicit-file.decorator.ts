import { DECORATORS } from '../constants';
import { createParamDecorator } from './helpers';
import { isNil } from 'lodash';
import { ApiBaseMetadata } from '../types/api-base-metadata';

const initialMetadata = {
  name: '',
  required: true
};

export const ApiImplicitFile = (metadata: ApiBaseMetadata): MethodDecorator => {
  const param = {
    name: isNil(metadata.name) ? initialMetadata.name : metadata.name,
    in: 'formData',
    description: metadata.description || '',
    required: metadata.required || false,
    type: 'file'
  };
  return createParamDecorator(param, initialMetadata);
};
