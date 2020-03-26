import { Logger, Type } from '@nestjs/common';

/* eslint-disable @typescript-eslint/no-var-requires */
const logger = new Logger('TypeHelpers');

export function applyIsOptionalDecorator(
  targetClass: Function,
  propertyKey: string
) {
  if (!isClassValidatorAvailable()) {
    return;
  }
  const classValidator: typeof import('class-validator') = require('class-validator');
  const decoratorFactory = classValidator.IsOptional();
  decoratorFactory(targetClass.prototype, propertyKey);
}

export function inheritValidationMetadata(
  parentClass: Type<any>,
  targetClass: Function,
  isPropertyInherited?: (key: string) => boolean
) {
  if (!isClassValidatorAvailable()) {
    return;
  }
  try {
    const classValidator: typeof import('class-validator') = require('class-validator');
    const metadataStorage = classValidator.getFromContainer(
      classValidator.MetadataStorage
    );
    const targetMetadata = metadataStorage.getTargetValidationMetadatas(
      parentClass,
      null
    );
    targetMetadata
      .filter(
        ({ propertyName }) =>
          !isPropertyInherited || isPropertyInherited(propertyName)
      )
      .forEach((value) =>
        metadataStorage.addValidationMetadata({
          ...value,
          target: targetClass
        })
      );
  } catch (err) {
    logger.error(
      `Validation ("class-validator") metadata cannot be inherited for "${parentClass.name}" class.`
    );
    logger.error(err);
  }
}

type TransformMetadataKey =
  | '_excludeMetadatas'
  | '_exposeMetadatas'
  | '_typeMetadatas'
  | '_transformMetadatas';

export function inheritTransformationMetadata(
  parentClass: Type<any>,
  targetClass: Function,
  isPropertyInherited?: (key: string) => boolean
) {
  if (!isClassTransformerAvailable()) {
    return;
  }
  try {
    const transformMetadataKeys: TransformMetadataKey[] = [
      '_excludeMetadatas',
      '_exposeMetadatas',
      '_transformMetadatas',
      '_typeMetadatas'
    ];
    transformMetadataKeys.forEach((key) =>
      inheritTransformerMetadata(
        key,
        parentClass,
        targetClass,
        isPropertyInherited
      )
    );
  } catch (err) {
    logger.error(
      `Transformer ("class-transformer") metadata cannot be inherited for "${parentClass.name}" class.`
    );
    logger.error(err);
  }
}

function inheritTransformerMetadata(
  key: TransformMetadataKey,
  parentClass: Type<any>,
  targetClass: Function,
  isPropertyInherited?: (key: string) => boolean
) {
  const classTransformer: typeof import('class-transformer/storage') = require('class-transformer/storage');
  const metadataStorage = classTransformer.defaultMetadataStorage;

  if (metadataStorage[key].has(parentClass)) {
    const metadataMap = metadataStorage[key] as Map<Function, Map<string, any>>;
    const parentMetadata = metadataMap.get(parentClass);

    const targetMetadataEntries: Iterable<[string, any]> = Array.from(
      parentMetadata.entries()
    )
      .filter(([key]) => !isPropertyInherited || isPropertyInherited(key))
      .map(([key, metadata]) => {
        if (Array.isArray(metadata)) {
          // "_transformMetadatas" is an array of elements
          const targetMetadata = metadata.map((item) => ({
            ...item,
            target: targetClass
          }));
          return [key, targetMetadata];
        }
        return [key, { ...metadata, target: targetClass }];
      });

    metadataMap.set(targetClass, new Map(targetMetadataEntries));
  }
}

function isClassValidatorAvailable() {
  try {
    require('class-validator');
    return true;
  } catch {
    return false;
  }
}

function isClassTransformerAvailable() {
  try {
    require('class-transformer');
    return true;
  } catch {
    return false;
  }
}
