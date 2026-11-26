import { Type } from '@nestjs/common';
import { isFunction, isString } from '@nestjs/common/utils/shared.utils.js';
import pick from 'es-toolkit/compat/pick';
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
   * Checks whether a field of the serialized model belongs to a hidden
   * property. The field is given by the name it has in the document, or by a
   * path starting with that name ("address/zip"). Unlike "isHiddenProperty()",
   * this resolves the name set with "@ApiProperty({ name })" to the property
   * key(s) that "@ApiHideProperty()" is recorded under. A name that a
   * documented property carries as well is not hidden.
   */
  isHiddenField(prototype: Type<unknown>, field: string): boolean {
    const [name] = String(field).split('/');
    const keys: string[] = (
      Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES_ARRAY, prototype) ||
      []
    )
      .filter(isString)
      .map((key: string) => key.slice(1))
      .filter(
        (key: string) =>
          (Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES, prototype, key)
            ?.name || key) === name
      );
    return keys.length > 0
      ? keys.every((key) => this.isHiddenProperty(prototype, key))
      : this.isHiddenProperty(prototype, name);
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

  /**
   * When a class re-declares an inherited property without a decorator, its
   * own CLI plugin metadata replaces what an ancestor's plugin metadata
   * inferred for the property, whichever class was explored first. Options set
   * with a decorator still apply, except for the type, which follows the
   * re-declaration as it does for a decorator re-declaring the property.
   */
  private keepDecoratedInheritedOptions(prototype: object, key: string) {
    if (
      Reflect.hasOwnMetadata(DECORATORS.API_MODEL_PROPERTIES, prototype, key)
    ) {
      return;
    }
    const inheritedMetadata = Reflect.getMetadata(
      DECORATORS.API_MODEL_PROPERTIES,
      prototype,
      key
    );
    if (!inheritedMetadata) {
      return;
    }
    const decoratedOptions = new Set<string>();
    for (
      let current = Reflect.getPrototypeOf(prototype);
      current && current !== Object.prototype;
      current = Reflect.getPrototypeOf(current)
    ) {
      (
        Reflect.getOwnMetadata(
          DECORATORS.API_MODEL_PROPERTY_EXPLICIT_OPTIONS,
          current,
          key
        ) ?? []
      ).forEach((option: string) => decoratedOptions.add(option));
    }
    decoratedOptions.delete('type');
    decoratedOptions.delete('isArray');

    Reflect.defineMetadata(
      DECORATORS.API_MODEL_PROPERTIES,
      pick(inheritedMetadata, [...decoratedOptions]),
      prototype,
      key
    );
  }

  applyMetadataFactory(prototype: Type<unknown>) {
    const classPrototype = prototype;
    do {
      if (!prototype.constructor) {
        return;
      }
      // A factory inherited through the static chain is applied once the loop
      // reaches the class that declares it, so that "@ApiHideProperty()" on
      // the classes in between is taken into account.
      if (
        !Object.prototype.hasOwnProperty.call(
          prototype.constructor,
          METADATA_FACTORY_NAME
        )
      ) {
        continue;
      }
      const metadata = prototype.constructor[METADATA_FACTORY_NAME]();
      const properties = Object.keys(metadata);
      const isOwnFactory = prototype === classPrototype;
      properties.forEach((key) => {
        // An ancestor's factory must not republish a property that the class
        // itself (or a closer ancestor) marked with "@ApiHideProperty()".
        if (this.isHiddenProperty(classPrototype, key, prototype)) {
          return;
        }
        if (isOwnFactory) {
          this.keepDecoratedInheritedOptions(classPrototype, key);
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
