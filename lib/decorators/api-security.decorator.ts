import isString from 'es-toolkit/compat/isString';
import { DECORATORS } from '../constants.js';
import { SecurityRequirementObject } from '../interfaces/open-api-spec.interface.js';
import { extendMetadata } from '../utils/extend-metadata.util.js';

/**
 * @publicApi
 */
export function ApiSecurity(
  name: string | SecurityRequirementObject,
  requirements: string[] = []
): ClassDecorator & MethodDecorator {
  let metadata: SecurityRequirementObject[];

  if (isString(name)) {
    metadata = [{ [name]: requirements }];
  } else {
    metadata = [name];
  }

  return (
    target: object,
    key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>
  ): any => {
    if (descriptor) {
      Reflect.defineMetadata(
        DECORATORS.API_SECURITY,
        extendMetadata(metadata, DECORATORS.API_SECURITY, descriptor.value),
        descriptor.value
      );
      return descriptor;
    }
    Reflect.defineMetadata(
      DECORATORS.API_SECURITY,
      extendMetadata(metadata, DECORATORS.API_SECURITY, target),
      target
    );
    return target;
  };
}
