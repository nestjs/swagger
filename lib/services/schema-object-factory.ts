import { Logger, Type } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import {
  flatten,
  isEqual,
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

  createFromModel(
    parameters: ParamWithTypeMetadata[],
    schemas: Record<string, SchemaObject>
  ): Array<ParamWithTypeMetadata | BaseParameterObject> {
    const parameterObjects = parameters.map((param) => {
      if (this.isLazyTypeFunc(param.type)) {
        [param.type, param.isArray] = getTypeIsArrayTuple(
          (param.type as Function)(),
          undefined
        ) as [Type<any>, boolean];
      }
      if (!isBodyParameter(param) && param.enumName) {
        return this.createEnumParam(param, schemas);
      }
      if (this.isPrimitiveType(param.type)) {
        return param;
      }
      if (this.isArrayCtor(param.type)) {
        return this.mapArrayCtorParam(param);
      }
      if (!isBodyParameter(param)) {
        return this.createQueryOrParamSchema(param, schemas);
      }
      return this.getCustomType(param, schemas);
    });

    return flatten(parameterObjects);
  }

  getCustomType(
    param: ParamWithTypeMetadata,
    schemas: Record<string, SchemaObject>
  ) {
    const modelName = this.exploreModelSchema(param.type, schemas);
    const name = param.name || modelName;
    const schema = {
      ...((param as BaseParameterObject).schema || {}),
      $ref: getSchemaPath(modelName)
    };
    const isArray = param.isArray;
    param = omit(param, 'isArray');

    if (isArray) {
      return {
        ...param,
        name,
        schema: {
          type: 'array',
          items: schema
        }
      };
    }
    return {
      ...param,
      name,
      schema
    };
  }

  private createQueryOrParamSchema(
    param: ParamWithTypeMetadata,
    schemas: Record<string, SchemaObject>
  ) {
    if (isDateCtor(param.type as Function)) {
      return {
        format: 'date-time',
        ...param,
        type: 'string'
      };
    }
    if (this.isBigInt(param.type as Function)) {
      return {
        format: 'int64',
        ...param,
        type: 'integer'
      };
    }
    if (isFunction(param.type)) {
      if (param.name) {
        // We should not spread parameters that have a name
        // Just generate the schema for the type instead and link it with ref if needed
        return this.getCustomType(param, schemas);
      }

      const propertiesWithType = this.extractPropertiesFromType(
        param.type,
        schemas
      );
      if (!propertiesWithType) {
        return param;
      }

      return propertiesWithType.map(
        (property: ParameterObject & ParamWithTypeMetadata) => {
          const keysToOmit = [
            'isArray',
            'enumName',
            'enumSchema',
            'selfRequired'
          ];
          const parameterObject = {
            ...(omit(property, keysToOmit) as ParameterObject),
            in: 'query',
            required:
              'selfRequired' in property
                ? property.selfRequired
                : typeof property.required === 'boolean'
                  ? property.required
                  : true
          };

          const keysToMoveToSchema = [
            ...this.swaggerTypesMapper.getSchemaOptionsKeys(),
            'allOf'
          ];
          return keysToMoveToSchema.reduce((acc, key) => {
            if (key in property) {
              acc.schema = { ...acc.schema, [key]: property[key] };
              delete acc[key];
            }
            return acc;
          }, parameterObject);
        }
      ) as ParameterObject[];
    }
    if (this.isObjectLiteral(param.type)) {
      const schemaFromObjectLiteral = this.createFromObjectLiteral(
        param.name as string,
        param.type as Record<string, any>,
        schemas
      );

      if (param.isArray) {
        return {
          ...param,
          schema: {
            type: 'array',
            items: omit(schemaFromObjectLiteral, 'name')
          },
          selfRequired: param.required
        };
      }
      return {
        ...param,
        schema: {
          type: schemaFromObjectLiteral.type,
          properties: schemaFromObjectLiteral.properties,
          required: schemaFromObjectLiteral.required
        },
        selfRequired: param.required
      };
    }
    return param;
  }

  /**
   *
   * @param type
   * @param schemas
   * @param pendingSchemasRefs Used internally to avoid infinite recursion
   */
  extractPropertiesFromType(
    type: Type<unknown>,
    schemas: Record<string, SchemaObject>,
    pendingSchemasRefs: string[] = []
  ) {
    const { prototype } = type;
    if (!prototype) {
      return;
    }
    const extraModels = exploreGlobalApiExtraModelsMetadata(type);
    extraModels.forEach((item) =>
      this.exploreModelSchema(item, schemas, pendingSchemasRefs)
    );

    this.modelPropertiesAccessor.applyMetadataFactory(prototype);
    const modelProperties =
      this.modelPropertiesAccessor.getModelProperties(prototype);
    const propertiesWithType = modelProperties.map((key) => {
      const property = this.mergePropertyWithMetadata(
        key,
        prototype,
        schemas,
        pendingSchemasRefs
      );

      const schemaCombinators = ['oneOf', 'anyOf', 'allOf'];
      const declaredSchemaCombinator = schemaCombinators.find(
        (combinator) => combinator in property
      );
      if (declaredSchemaCombinator) {
        const schemaObjectMetadata = property as SchemaObjectMetadata;

        if (
          schemaObjectMetadata?.type === 'array' ||
          schemaObjectMetadata.isArray
        ) {
          schemaObjectMetadata.items = {};
          schemaObjectMetadata.items[declaredSchemaCombinator] =
            property[declaredSchemaCombinator];
          delete property[declaredSchemaCombinator];
        } else {
          delete schemaObjectMetadata.type;
        }
      }
      return property as ParameterObject;
    });
    return propertiesWithType;
  }

  /**
   *
   * @param type
   * @param schemas
   * @param pendingSchemasRefs Used internally to avoid infinite recursion
   */
  exploreModelSchema(
    type: Type<unknown> | Function,
    schemas: Record<string, SchemaObject>,
    pendingSchemasRefs: string[] = []
  ): string {
    if (this.isLazyTypeFunc(type as Function)) {
      type = (type as Function)();
    }
    const propertiesWithType = this.extractPropertiesFromType(
      type as Type<unknown>,
      schemas,
      pendingSchemasRefs
    );
    if (!propertiesWithType) {
      return '';
    }
    const extensionProperties =
      Reflect.getMetadata(DECORATORS.API_EXTENSION, type) || {};

    const { schemaName, schemaProperties } = this.getSchemaMetadata(type);

    const typeDefinition: SchemaObject = {
      type: 'object',
      properties: mapValues(keyBy(propertiesWithType, 'name'), (property) => {
        const keysToOmit = [
          'name',
          'isArray',
          'enumName',
          'enumSchema',
          'selfRequired'
        ];

        if ('required' in property && Array.isArray(property.required)) {
          return omit(property, keysToOmit);
        }

        return omit(property, [...keysToOmit, 'required']);
      }) as Record<string, SchemaObject | ReferenceObject>,
      ...extensionProperties,
      ...schemaProperties
    };

    const typeDefinitionRequiredFields = propertiesWithType
      .filter((property) =>
        'selfRequired' in property
          ? property.selfRequired != false
          : property.required != false && !Array.isArray(property.required)
      )
      .map((property) => property.name);

    if (typeDefinitionRequiredFields.length > 0) {
      typeDefinition['required'] = typeDefinitionRequiredFields;
    }

    if (schemas[schemaName] && !isEqual(schemas[schemaName], typeDefinition)) {
      Logger.error(
        `Duplicate DTO detected: "${schemaName}" is defined multiple times with different schemas.\n` +
          `Consider using unique class names or applying @ApiExtraModels() decorator with custom schema names.\n` +
          `Note: This will throw an error in the next major version.`
      );
    }

    schemas[schemaName] = typeDefinition;

    return schemaName;
  }

  getSchemaMetadata(type: Function | Type<unknown>) {
    const schemas: ApiSchemaOptions[] =
      Reflect.getOwnMetadata(DECORATORS.API_SCHEMA, type) ?? [];
    const { name, ...schemaProperties } = schemas[schemas.length - 1] ?? {};
    return { schemaName: name ?? type.name, schemaProperties };
  }

  mergePropertyWithMetadata(
    key: string,
    prototype: Type<unknown>,
    schemas: Record<string, SchemaObject>,
    pendingSchemaRefs: string[],
    metadata?: SchemaObjectMetadata
  ):
    | SchemaObjectMetadata
    | ReferenceObject
    | ParameterObject
    | (SchemaObject & { selfRequired?: boolean }) {
    if (!metadata) {
      metadata =
        omit(
          Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES, prototype, key),
          'link'
        ) || {};
    }

    if (this.isLazyTypeFunc(metadata.type as Function)) {
      metadata.type = (metadata.type as Function)();
      [metadata.type, metadata.isArray] = getTypeIsArrayTuple(
        metadata.type as Function,
        metadata.isArray
      );
    }

    if (Array.isArray(metadata.type)) {
      return this.createFromNestedArray(
        key,
        metadata,
        schemas,
        pendingSchemaRefs
      );
    }

    return this.createSchemaMetadata(key, metadata, schemas, pendingSchemaRefs);
  }

  createEnumParam(
    param: ParamWithTypeMetadata & BaseParameterObject,
    schemas: Record<string, SchemaObject>
  ) {
    const enumName = param.enumName;
    const $ref = getSchemaPath(enumName);

    if (!(enumName in schemas)) {
      const _enum = param.enum
        ? param.enum
        : param.schema
          ? param.schema['items']
            ? param.schema['items']['enum']
            : param.schema['enum']
          : param.isArray && param.items
            ? param.items.enum
            : undefined;

      schemas[enumName] = {
        type:
          (param.isArray
            ? param.schema?.['items']?.['type']
            : param.schema?.['type']) ?? 'string',
        enum: _enum,
        ...param.enumSchema,
        ...(param['x-enumNames'] ? { 'x-enumNames': param['x-enumNames'] } : {})
      };
    } else {
      // Enum type is already defined so grab it and
      // assign additional metadata if specified
      if (param.enumSchema) {
        schemas[enumName] = {
          ...schemas[enumName],
          ...param.enumSchema
        };
      }
    }

    param.schema =
      param.isArray || param.schema?.['items']
        ? { type: 'array', items: { $ref } }
        : { $ref };

    return omit(param, [
      'isArray',
      'items',
      'enumName',
      'enum',
      'x-enumNames',
      'enumSchema'
    ]);
  }

  createEnumSchemaType(
    key: string,
    metadata: SchemaObjectMetadata,
    schemas: Record<string, SchemaObject>
  ): SchemaObjectMetadata {
    if (!('enumName' in metadata) || !metadata.enumName) {
      return {
        ...metadata,
        name: metadata.name || key
      };
    }

    const enumName = metadata.enumName;
    const $ref = getSchemaPath(enumName);

    const enumType: string =
      (metadata.isArray ? metadata.items['type'] : metadata.type) ?? 'string';

    if (!schemas[enumName]) {
      schemas[enumName] = {
        type: enumType,
        ...metadata.enumSchema,
        enum:
          metadata.isArray && metadata.items
            ? metadata.items['enum']
            : metadata.enum,
        description: metadata.description ?? undefined,
        'x-enumNames': metadata['x-enumNames'] ?? undefined
      };
    } else {
      if (metadata.enumSchema) {
        schemas[enumName] = {
          ...schemas[enumName],
          ...metadata.enumSchema
        };
      }

      if (metadata['x-enumNames']) {
        schemas[enumName]['x-enumNames'] = metadata['x-enumNames'];
      }
    }

    const _schemaObject = {
      ...metadata,
      name: metadata.name || key,
      type: metadata.isArray ? 'array' : 'string'
    };

    const refHost = metadata.isArray
      ? { items: { $ref } }
      : { allOf: [{ $ref }] };

    const paramObject = { ..._schemaObject, ...refHost };
    const pathsToOmit = ['enum', 'enumName', 'enumSchema', 'x-enumNames'];

    if (!metadata.isArray) {
      pathsToOmit.push('type');
    }

    return omit(paramObject, pathsToOmit) as SchemaObjectMetadata;
  }

  createNotBuiltInTypeReference(
    key: string,
    metadata: SchemaObjectMetadata,
    trueMetadataType: unknown,
    schemas: Record<string, SchemaObject>,
    pendingSchemaRefs: string[]
  ): SchemaObjectMetadata {
    if (isUndefined(trueMetadataType)) {
      throw new Error(
        `A circular dependency has been detected (property key: "${key}"). Please, make sure that each side of a bidirectional relationships are using lazy resolvers ("type: () => ClassType").`
      );
    }
    let { schemaName: schemaObjectName } = this.getSchemaMetadata(
      trueMetadataType as Function | Type<unknown>
    );

    if (
      !(schemaObjectName in schemas) &&
      !pendingSchemaRefs.includes(schemaObjectName)
    ) {
      schemaObjectName = this.exploreModelSchema(
        trueMetadataType as Function,
        schemas,
        [...pendingSchemaRefs, schemaObjectName]
      );
    }
    const $ref = getSchemaPath(schemaObjectName);
    if (metadata.isArray) {
      return this.transformToArraySchemaProperty(metadata, key, { $ref });
    }
    const keysToRemove = ['type', 'isArray', 'required', 'name'];
    const validMetadataObject = omit(metadata, keysToRemove);
    const extraMetadataKeys = Object.keys(validMetadataObject);

    if (extraMetadataKeys.length > 0) {
      return {
        name: metadata.name || key,
        required: metadata.required,
        ...validMetadataObject,
        allOf: [{ $ref }]
      } as SchemaObjectMetadata;
    }
    return {
      name: metadata.name || key,
      required: metadata.required,
      $ref
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
      items: metadata.items
        ? { ...(metadata.items as Record<string, any>), ...movedProperties }
        : isString(type)
          ? { type, ...movedProperties }
          : { ...type, ...movedProperties }
    };
    schemaHost.items = omitBy(schemaHost.items, isUndefined);

    return schemaHost as unknown;
  }

  mapArrayCtorParam(param: ParamWithTypeMetadata): any {
    return {
      ...omit(param, 'type'),
      schema: {
        type: 'array',
        items: {
          type: 'string'
        }
      }
    };
  }

  createFromObjectLiteral(
    key: string,
    literalObj: Record<string, any>,
    schemas: Record<string, SchemaObject>
  ) {
    const objLiteralKeys = Object.keys(literalObj);
    const properties = {};
    const required = [];

    objLiteralKeys.forEach((key) => {
      const propertyCompilerMetadata = literalObj[key];
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
        key,
        Object,
        schemas,
        [],
        propertyCompilerMetadata
      );

      if ('required' in propertyMetadata && propertyMetadata.required) {
        required.push(key);
      }
      const keysToRemove = ['isArray', 'name', 'required'];
      const validMetadataObject = omit(propertyMetadata, keysToRemove);
      properties[key] = validMetadataObject;
    });

    const schema = {
      name: key,
      type: 'object',
      properties,
      required
    };
    return schema;
  }

  createFromNestedArray(
    key: string,
    metadata: SchemaObjectMetadata,
    schemas: Record<string, SchemaObject>,
    pendingSchemaRefs: string[]
  ) {
    const recurse = (type: unknown) => {
      if (!Array.isArray(type)) {
        const schemaMetadata = this.createSchemaMetadata(
          key,
          metadata,
          schemas,
          pendingSchemaRefs,
          type
        );
        return omit(schemaMetadata, ['isArray', 'name']);
      }

      return {
        name: key,
        type: 'array',
        items: recurse(type[0])
      };
    };

    return recurse(metadata.type);
  }

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
      if (metadata.isArray) {
        return {
          name: schemaFromObjectLiteral.name,
          type: 'array',
          items: omit(schemaFromObjectLiteral, 'name'),
          selfRequired: metadata.required as boolean
        };
      }

      return {
        ...schemaFromObjectLiteral,
        selfRequired: metadata.required as boolean
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

      // Check if the schema has a combinator because if so
      // we should not auto-wrap the type in an array
      //
      // Example:
      // @ApiProperty({
      //   oneOf: [
      //     { type: 'array', items: { type: 'string' } },
      //     { type: 'array', items: { type: 'number' } },
      //     { type: 'array', items: { type: 'boolean' } }
      //   ],
      // })
      // attribute: string[] | number[] | boolean[];
      //
      // this should not produce an array of arrays
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

  private isArrayCtor(type: Type<unknown> | string): boolean {
    return type === Array;
  }

  private isPrimitiveType(type: Type<unknown> | string): boolean {
    return (
      isFunction(type) &&
      [String, Boolean, Number].some((item) => item === type)
    );
  }

  private isLazyTypeFunc(
    type: Function | Type<unknown> | string
  ): type is { type: Function } & Function {
    return isFunction(type) && type.name == 'type';
  }

  private getTypeName(type: Type<unknown> | string): string {
    return type && isFunction(type) ? type.name : (type as string);
  }

  private isObjectLiteral(obj: Record<string, any> | undefined) {
    if (typeof obj !== 'object' || !obj) {
      return false;
    }
    const hasOwnProp = Object.prototype.hasOwnProperty;
    let objPrototype = obj;
    while (
      Object.getPrototypeOf(
        (objPrototype = Object.getPrototypeOf(objPrototype))
      ) !== null
    );

    for (const prop in obj) {
      if (!hasOwnProp.call(obj, prop) && !hasOwnProp.call(objPrototype, prop)) {
        return false;
      }
    }
    return Object.getPrototypeOf(obj) === objPrototype;
  }

  private isBigInt(type: Function | Type<unknown> | string): boolean {
    return type === BigInt;
  }

  private extractPropertyModifiers(
    metadata: SchemaObjectMetadata
  ): [Partial<SchemaObjectMetadata>, string[]] {
    const modifierKeys = [
      'format',
      'maximum',
      'maxLength',
      'minimum',
      'minLength',
      'pattern'
    ];
    return [pick(metadata, modifierKeys), modifierKeys];
  }
}
