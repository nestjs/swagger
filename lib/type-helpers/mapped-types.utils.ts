import { Type } from '@nestjs/common';
import { identity } from 'es-toolkit/compat';
import { METADATA_FACTORY_NAME } from '../plugin/plugin-constants';

export function clonePluginMetadataFactory(
  target: Type<unknown>,
  parent: Type<unknown>,
  transformFn: (metadata: Record<string, any>) => Record<string, any> = identity
) {
  let targetMetadata = {};

  do {
    if (!parent.constructor) {
      return;
    }
    if (!parent.constructor[METADATA_FACTORY_NAME]) {
      continue;
    }
    const parentMetadata = parent.constructor[METADATA_FACTORY_NAME]();
    targetMetadata = {
      ...parentMetadata,
      ...targetMetadata
    };
  } while (
    (parent = Reflect.getPrototypeOf(parent) as Type<any>) &&
    parent !== Object.prototype &&
    parent
  );
  targetMetadata = transformFn(targetMetadata);

  if (target[METADATA_FACTORY_NAME]) {
    const originalFactory = target[METADATA_FACTORY_NAME];
    target[METADATA_FACTORY_NAME] = () => {
      const originalMetadata = originalFactory();
      return {
        ...originalMetadata,
        ...targetMetadata
      };
    };
  } else {
    target[METADATA_FACTORY_NAME] = () => targetMetadata;
  }
}
