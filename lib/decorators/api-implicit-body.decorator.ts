import { isNil } from 'lodash';
import { createParamDecorator, getTypeIsArrayTuple } from './helpers';
import { ApiBaseMetadata } from '../types/api-base-metadata';

const initialMetadata = {
  name: '',
  required: true,
  type: String
};

export interface ApiImplicitBodyMetadata extends ApiBaseMetadata {
  type: any;
  isArray?: boolean;
}

export const ApiImplicitBody = (
  metadata: ApiImplicitBodyMetadata
): MethodDecorator => {
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
