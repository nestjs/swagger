import { isNil } from 'lodash';
import { createParamDecorator } from './helpers';

const initialMetadata = {
  name: '',
  required: true
};

export const ApiImplicitParam = (metadata: {
  name: string;
  description?: string;
  required?: boolean;
  type?: 'String' | 'Number' | 'Boolean' | any;
}): MethodDecorator => {
  const param = {
    name: isNil(metadata.name) ? initialMetadata.name : metadata.name,
    in: 'path',
    description: metadata.description,
    required: metadata.required,
    type: metadata.type
  };
  return createParamDecorator(param, initialMetadata);
};
