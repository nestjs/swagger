import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';
import { ApiOperation } from '../decorators/api-operation.decorator';
import { METADATA_FACTORY_NAME } from '../plugin/plugin-constants';

export const exploreApiOperationMetadata = (
  instance: object,
  prototype: Type<unknown>,
  method: object
) => {
  applyMetadataFactory(prototype, instance);
  return Reflect.getMetadata(DECORATORS.API_OPERATION, method);
};

function applyMetadataFactory(prototype: Type<unknown>, instance: object) {
  const classPrototype = prototype;
  do {
    if (!prototype.constructor) {
      return;
    }
    if (!prototype.constructor[METADATA_FACTORY_NAME]) {
      continue;
    }
    const metadata = prototype.constructor[METADATA_FACTORY_NAME]();
    const methodKeys = Object.keys(metadata).filter(
      (key) => typeof instance[key] === 'function'
    );

    methodKeys.forEach((key) => {
      const operationMeta = {};
      const { summary, deprecated, tags } = metadata[key];

      applyIfNotNil(operationMeta, 'summary', summary);
      applyIfNotNil(operationMeta, 'deprecated', deprecated);
      applyIfNotNil(operationMeta, 'tags', tags);

      if (Object.keys(operationMeta).length === 0) {
        return;
      }
      ApiOperation(operationMeta, { overrideExisting: false })(
        classPrototype,
        key,
        Object.getOwnPropertyDescriptor(classPrototype, key)
      );
    });
  } while (
    (prototype = Reflect.getPrototypeOf(prototype) as Type<any>) &&
    prototype !== Object.prototype &&
    prototype
  );
}

function applyIfNotNil(target: Record<string, any>, key: string, value: any) {
  if (value !== undefined && value !== null) {
    target[key] = value;
  }
}
