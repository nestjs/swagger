import { isArray, isUndefined, negate, pickBy } from 'lodash';
import { DECORATORS } from '../constants';

export const createMethodDecorator = (metakey, metadata): MethodDecorator => {
  return (target, key, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(metakey, metadata, descriptor.value);
    return descriptor;
  };
};

export const createClassDecorator = (metakey, metadata): ClassDecorator => {
  return target => {
    Reflect.defineMetadata(metakey, metadata, target);
    return target;
  };
};

export const createPropertyDecorator = (
  metakey,
  metadata
): PropertyDecorator => {
  return (target: object, propertyKey: string) => {
    const properties =
      Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES_ARRAY, target) || [];
    Reflect.defineMetadata(
      DECORATORS.API_MODEL_PROPERTIES_ARRAY,
      [...properties, `:${propertyKey}`],
      target
    );
    Reflect.defineMetadata(
      metakey,
      {
        type: Reflect.getMetadata('design:type', target, propertyKey),
        ...pickBy(metadata, negate(isUndefined))
      },
      target,
      propertyKey
    );
  };
};

export const createMixedDecorator = (metakey, metadata) => {
  return (target: object, key?, descriptor?) => {
    if (descriptor) {
      Reflect.defineMetadata(metakey, metadata, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(metakey, metadata, target);
    return target;
  };
};

export const createParamDecorator = (metadata, initial) => {
  return (target, key, descriptor: PropertyDescriptor) => {
    const parameters =
      Reflect.getMetadata(DECORATORS.API_PARAMETERS, descriptor.value) || [];
    Reflect.defineMetadata(
      DECORATORS.API_PARAMETERS,
      [
        ...parameters,
        {
          ...initial,
          ...pickBy(metadata, negate(isUndefined))
        }
      ],
      descriptor.value
    );
    return descriptor;
  };
};

export const createMultipleParamDecorator = (multiMetadata: any[], initial) => {
  return (target, key, descriptor: PropertyDescriptor) => {
    const parameters =
      Reflect.getMetadata(DECORATORS.API_PARAMETERS, descriptor.value) || [];
    Reflect.defineMetadata(
      DECORATORS.API_PARAMETERS,
      [
        ...parameters,
        ...multiMetadata.map(metadata => ({
          ...initial,
          ...pickBy(metadata, negate(isUndefined))
        }))
      ],
      descriptor.value
    );
    return descriptor;
  };
};

export const getTypeIsArrayTuple = (
  input: Function | [Function] | undefined,
  isArrayFlag: boolean
): [Function | undefined, boolean] => {
  if (!input) {
    return [input as undefined, isArrayFlag];
  }
  if (isArrayFlag) {
    return [input as Function, isArrayFlag];
  }
  const isInputArray = isArray(input);
  const type = isInputArray ? input[0] : input;
  return [type, isInputArray];
};

/*
  This functions adds spaces to response status code to ensure that
  responses with the same status code are not overlaying each other.

  Note: swagger takes a string for a response code and not a number
*/
export const getValidResponseName = (
  name: string | number,
  responses: { [key: string]: any }
): string => {
  let validName = name.toString();
  while (responses[validName]) {
    validName += ' ';
  }
  return validName;
};
