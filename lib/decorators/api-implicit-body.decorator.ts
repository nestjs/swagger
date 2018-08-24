import { isNil } from 'lodash';
import { createParamDecorator, getTypeIsArrayTuple } from './helpers';

const initialMetadata = {
  name: '',
  required: true,
  type: String
};

export const ApiImplicitBody = (metadata: {
  name: string;
  type: any;
  description?: string;
  required?: boolean;
  isArray?: boolean;
}): MethodDecorator => {
  const [type, isArray] = getTypeIsArrayTuple(metadata.type, metadata.isArray);
  const param = {
    name: isNil(metadata.name) ? initialMetadata.name : metadata.name,
    in: 'body',
    description: metadata.description,
    required: metadata.required,
    type,
    isArray
  };
  return createParamDecorator(param, initialMetadata);
};
