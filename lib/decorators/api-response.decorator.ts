import { DECORATORS } from '../constants';
import { omit } from 'lodash';

const initialMetadata = {
  status: 0,
  type: String,
  isArray: false,
  examples: '',
};

export const ApiResponse = (metadata: {
  status: number;
  description?: string;
  type?: any;
  isArray?: boolean;
  examples?: any;
}) => {
  metadata.description = metadata.description ? metadata.description : '';
  const groupedMetadata = { [metadata.status]: omit(metadata, 'status') };
  return (target, key?, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      const responses =
        Reflect.getMetadata(DECORATORS.API_RESPONSE, descriptor.value) || {};
      Reflect.defineMetadata(
        DECORATORS.API_RESPONSE,
        {
          ...responses,
          ...groupedMetadata,
        },
        descriptor.value,
      );
      return descriptor;
    }
    const responses =
      Reflect.getMetadata(DECORATORS.API_RESPONSE, target) || {};
    Reflect.defineMetadata(
      DECORATORS.API_RESPONSE,
      {
        ...responses,
        ...groupedMetadata,
      },
      target,
    );
    return target;
  };
};
