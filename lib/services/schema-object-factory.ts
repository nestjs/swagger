import { Type } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import {
  flatten,
  isFunction,
  isString,
  keyBy,
  mapValues,
  omit,
  omitBy,
  pick
} from 'lodash';
import { DECORATORS } from '../constants';
import { ApiSchemaOptions } from '../decorators';
import { getTypeIsArrayTuple } from '../decorators/helpers';
import { exploreGlobalApiExtraModelsMetadata } from '../explorers/api-extra-models.explorer';
import {
  BaseParameterObject,
  ParameterObject,
  ReferenceObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface';
import { SchemaObjectMetadata } from '../interfaces/schema-object-metadata.interface';
import { getSchemaPath } from '../utils';
import {
  getEnumType,
  getEnumValues,
  isEnumArray,
  isEnumMetadata
} from '../utils/enum.utils';
import { isBodyParameter } from '../utils/is-body-parameter.util';
import { isBuiltInType } from '../utils/is-built-in-type.util';
import { isDateCtor } from '../utils/is-date-ctor.util';
import { ModelPropertiesAccessor } from './model-properties-accessor';
import { ParamWithTypeMetadata } from './parameter-metadata-accessor';
import { SwaggerTypesMapper } from './swagger-types-mapper';

export class SchemaObjectFactory {
  constructor(
    private readonly modelPropertiesAccessor: ModelPropertiesAccessor,
    private readonly swaggerTypesMapper: SwaggerTypesMapper
  ) {}

  // ... (previous methods remain unchanged)

  private createSchemaMetadata(
    key: string,
    metadata: SchemaObjectMetadata,
    schemas: Record<string, SchemaObject>,
    pendingSchemaRefs: string[],
    nestedArrayType?: unknown
  ):
    | SchemaObjectMetadata
    | ReferenceObject
    | ParameterObject
    | (SchemaObject & { selfRequired?: boolean }) {
    const typeRef = nestedArrayType || metadata.type;
    if (this.isObjectLiteral(typeRef as Record<string, any>)) {
      const schemaFromObjectLiteral = this.createFromObjectLiteral(
        key,
        typeRef as Record<string, any>,
        schemas
      );
      return {
        ...schemaFromObjectLiteral,
        required: metadata.required as boolean
      };
    }

    if (isString(typeRef)) {
      if (isEnumMetadata(metadata)) {
        return this.createEnumSchemaType(key, metadata, schemas);
      }
      if (metadata.isArray) {
        return this.transformToArraySchemaProperty(metadata, key, typeRef);
      }

      return {
        ...metadata,
        name: metadata.name || key
      };
    }
    if (isDateCtor(typeRef as Function)) {
      if (metadata.isArray) {
        return this.transformToArraySchemaProperty(metadata, key, {
          format: metadata.format || 'date-time',
          type: 'string'
        });
      }
      return {
        format: 'date-time',
        ...metadata,
        type: 'string',
        name: metadata.name || key
      } as SchemaObjectMetadata;
    }
    if (this.isBigInt(typeRef as Function)) {
      return {
        format: 'int64',
        ...metadata,
        type: 'integer',
        name: metadata.name || key
      } as SchemaObjectMetadata;
    }
    if (!isBuiltInType(typeRef as Function)) {
      return this.createNotBuiltInTypeReference(
        key,
        metadata,
        typeRef,
        schemas,
        pendingSchemaRefs
      );
    }
    const typeName = this.getTypeName(typeRef as Type<unknown>);
    const itemType = this.swaggerTypesMapper.mapTypeToOpenAPIType(typeName);

    if (metadata.isArray) {
      return this.transformToArraySchemaProperty(metadata, key, {
        type: itemType
      });
    } else if (itemType === 'array') {
      const defaultOnArray = 'string';

      const hasSchemaCombinator = ['oneOf', 'anyOf', 'allOf'].some(
        (combinator) => combinator in metadata
      );
      if (hasSchemaCombinator) {
        return {
          ...metadata,
          type: undefined,
          name: metadata.name || key
        };
      }

      return this.transformToArraySchemaProperty(metadata, key, {
        type: defaultOnArray
      });
    }
    return {
      ...metadata,
      name: metadata.name || key,
      type: itemType
    } as SchemaObjectMetadata;
  }

  transformToArraySchemaProperty(
    metadata: SchemaObjectMetadata,
    key: string,
    type: string | Record<string, any>
  ): SchemaObjectMetadata {
    const keysToRemove = ['type', 'enum'];
    const [movedProperties, keysToMove] =
      this.extractPropertyModifiers(metadata);
    const schemaHost = {
      ...omit(metadata, [...keysToRemove, ...keysToMove]),
      name: metadata.name || key,
      type: 'array',
      items: isString(type)
        ? { type, ...movedProperties }
        : { ...type, ...movedProperties }
    };
    schemaHost.items = omitBy(schemaHost.items, isUndefined);

    // Preserve the required field
    if (metadata.required !== undefined) {
      schemaHost.required = metadata.required;
    }

    return schemaHost as unknown as SchemaObjectMetadata;
  }

  createFromObjectLiteral(
    key: string,
    literalObj: Record<string, any>,
    schemas: Record<string, SchemaObject>
  ) {
    const objLiteralKeys = Object.keys(literalObj);
    const properties = {};
    const required = [];

    objLiteralKeys.forEach((propKey) => {
      const propertyCompilerMetadata = literalObj[propKey];
      if (isEnumArray<Record<string, any>>(propertyCompilerMetadata)) {
        propertyCompilerMetadata.type = 'array';

        const enumValues = getEnumValues(propertyCompilerMetadata.enum);
        propertyCompilerMetadata.items = {
          type: getEnumType(enumValues),
          enum: enumValues
        };
        delete propertyCompilerMetadata.enum;
      } else if (propertyCompilerMetadata.enum) {
        const enumValues = getEnumValues(propertyCompilerMetadata.enum);

        propertyCompilerMetadata.enum = enumValues;
        propertyCompilerMetadata.type = getEnumType(enumValues);
      }
      const propertyMetadata = this.mergePropertyWithMetadata(
        propKey,
        Object,
        schemas,
        [],
        propertyCompilerMetadata
      );

      if ('required' in propertyMetadata && propertyMetadata.required) {
        required.push(propKey);
      }
      const keysToRemove = ['isArray', 'name', 'required'];
      const validMetadataObject = omit(propertyMetadata, keysToRemove);
      properties[propKey] = validMetadataObject;

      // Handle nested required fields
      if (validMetadataObject.type === 'object' && validMetadataObject.properties) {
        const nestedRequired = [];
        Object.entries(validMetadataObject.properties).forEach(([nestedKey, nestedValue]) => {
          if (nestedValue.required) {
            nestedRequired.push(nestedKey);
          }
        });
        if (nestedRequired.length > 0) {
          validMetadataObject.required = nestedRequired;
        }
      }
    });

    const schema = {
      name: key,
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined
    };
    return schema;
  }

  // ... (remaining methods unchanged)
}
