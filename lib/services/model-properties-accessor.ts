import { Type } from '@nestjs/common';
import { isFunction, isString } from '@nestjs/common/utils/shared.utils.js';
import 'reflect-metadata';
import { DECORATORS } from '../constants.js';
import { createApiPropertyDecorator } from '../decorators/api-property.decorator.js';
import { METADATA_FACTORY_NAME } from '../plugin/plugin-constants.js';

export class ModelPropertiesAccessor {
  getModelProperties(prototype: Type<unknown>): string[] {
    const properties =
      Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES_ARRAY, prototype) ||
      [];

    return properties
      .filter(isString)
      .filter(
        (key: string) => key.charAt(0) === ':' && !isFunction(prototype[key])
      )
      .map((key: string) => key.slice(1))
      .filter((key: string) => !this.isHiddenProperty(prototype, key));
  }

  /**
   * Checks whether "@ApiHideProperty()" applies to the given property.
   * The nearest class in the prototype chain that declares anything about the
   * property wins, so a subclass can hide a property its parent publishes and
   * vice versa. When both decorators are declared on the same class, hiding
   * takes priority (as in the CLI plugin). Classes above "stopAt" are not
   * consulted.
   */
  isHiddenProperty(
    prototype: Type<unknown>,
    key: string,
    stopAt?: object
  ): boolean {
    let current: object = prototype;
    while (current && current !== Object.prototype) {
      if (
        Reflect.getOwnMetadata(
          DECORATORS.API_MODEL_PROPERTY_HIDDEN,
          current,
          key
        )
      ) {
        return true;
      }
      if (
        current === stopAt ||
        Reflect.getOwnMetadata(DECORATORS.API_MODEL_PROPERTIES, current, key)
      ) {
        return false;
      }
      current = Reflect.getPrototypeOf(current);
    }
    return false;
  }

  applyMetadataFactory(prototype: Type<unknown>) {
    const classPrototype = prototype;
    do {
      if (!prototype.constructor) {
        return;
      }
      if (!prototype.constructor[METADATA_FACTORY_NAME]) {
        continue;
      }
      const metadata = prototype.constructor[METADATA_FACTORY_NAME]();
      const properties = Object.keys(metadata);
      properties.forEach((key) => {
        // An ancestor's factory must not republish a property that the class
        // itself (or a closer ancestor) marked with "@ApiHideProperty()".
        if (this.isHiddenProperty(classPrototype, key, prototype)) {
          return;
        }
        createApiPropertyDecorator(metadata[key], false)(classPrototype, key);
      });
    } while (
      (prototype = Reflect.getPrototypeOf(prototype) as Type<any>) &&
      prototype !== Object.prototype &&
      prototype
    );
  }
}
