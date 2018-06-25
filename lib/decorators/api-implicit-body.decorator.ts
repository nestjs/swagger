import { isNil } from 'lodash';
import { createParamDecorator } from './helpers';

const initialMetadata = {
  name: '',
  required: true
};

export const ApiImplicitBody = (metadata: {
  name: string;
  description?: string;
  required?: boolean;
  type?: any;
  isArray?: boolean;
}): MethodDecorator => {
  const param = {
    name: isNil(metadata.name) ? initialMetadata.name : metadata.name,
    in: 'body',
    description: metadata.description,
    required: metadata.required,
    type: metadata.type,
    isArray: metadata.isArray
  };
  return createParamDecorator(param, initialMetadata);
};
