import { DECORATORS } from '../constants';
import { createParamDecorator } from './helpers';
import { isNil } from 'lodash';

const initialMetadata = {
  name: '',
  required: true
};

export const ApiImplicitFile = (metadata: {
  name: string;
  description?: string;
  required?: boolean;
}): MethodDecorator => {
  const param = {
    name: isNil(metadata.name) ? initialMetadata.name : metadata.name,
    in: 'formData',
    description: metadata.description || '',
    required: metadata.required || false,
    type: 'file'
  };
  return createParamDecorator(param, initialMetadata);
};
