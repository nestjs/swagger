import { Type } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import {
  includes,
  isFunction,
  isString,
  keyBy,
  mapValues,
  omit,
  omitBy
} from 'lodash';
import { DECORATORS } from '../constants';
import { getTypeIsArrayTuple } from '../decorators/helpers';
import { exploreGlobalApiExtraModelsMetadata } from '../explorers/api-extra-models.explorer';
import {
  BaseParameterObject,
  ReferenceObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface';
import { SchemaObjectMetadata } from '../interfaces/schema-object-metadata.interface';
import { getSchemaPath } from '../utils';
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
    schemas: SchemaObject[]
  ): Array<ParamWithTypeMetadata | BaseParameterObject> {
    return parameters.map(param => {
      if (!isBodyParameter(param)) {
        return param;
      }
      if (this.isPrimitiveType(param.type)) {
        return param;
      }
      if (this.isArrayCtor(param.type)) {
        return this.mapArrayCtorParam(param);
      }

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
    });
  }

  exploreModelSchema(
    type: Type<unknown> | Function,
    schemas: SchemaObject[],
    schemaRefsStack: string[] = []
  ) {
    if (this.isLazyTypeFunc(type as Function)) {
      type = (type as Function)();
    }
    const { prototype } = type;
    if (!prototype) {
      return '';
    }
    const extraModels = exploreGlobalApiExtraModelsMetadata(
      type as Type<unknown>
    );
    extraModels.forEach(item =>
      this.exploreModelSchema(item, schemas, schemaRefsStack)
    );

    this.modelPropertiesAccessor.applyMetadataFactory(prototype);
    const modelProperties = this.modelPropertiesAccessor.getModelProperties(
      prototype
    );
    const propertiesWithType = modelProperties.map(key => {
      const property = this.mergePropertyWithMetadata(
        key,
        prototype,
        schemas,
        schemaRefsStack
      );
      const schemaCombinators = ['oneOf', 'anyOf', 'allOf'];
      if (schemaCombinators.some(key => key in property)) {
        delete (property as SchemaObjectMetadata).type;
      }
      return property;
    });
    const typeDefinition: SchemaObject = {
      type: 'object',
      properties: mapValues(keyBy(propertiesWithType, 'name'), property =>
        omit(property, ['name', 'isArray', 'required'])
      ) as Record<string, SchemaObject | ReferenceObject>
    };
    const typeDefinitionRequiredFields = (propertiesWithType as SchemaObjectMetadata[])
      .filter(property => property.required != false)
      .map(property => property.name);

    if (typeDefinitionRequiredFields.length > 0) {
      typeDefinition['required'] = typeDefinitionRequiredFields;
    }
    schemas.push({
      [type.name]: typeDefinition
    });
    return type.name;
  }

  mergePropertyWithMetadata(
    key: string,
    prototype: Type<unknown>,
    schemas: SchemaObject[],
    schemaRefsStack: string[] = [],
    metadata?: SchemaObjectMetadata
  ): SchemaObjectMetadata | ReferenceObject {
    if (!metadata) {
      metadata =
        Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES, prototype, key) ||
        {};
    }
    if (this.isLazyTypeFunc(metadata.type as Function)) {
      metadata.type = (metadata.type as Function)();
      [metadata.type, metadata.isArray] = getTypeIsArrayTuple(
        metadata.type as Function,
        metadata.isArray
      );
    }
    if (this.isObjectLiteral(metadata.type as Record<string, any>)) {
      return this.createFromObjectLiteral(
        key,
        metadata.type as Record<string, any>,
        schemas,
        schemaRefsStack
      );
    }
    if (isString(metadata.type)) {
      return {
        ...metadata,
        name: metadata.name || key
      };
    }
    if (isDateCtor(metadata.type as Function)) {
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
      };
    }
    if (!isBuiltInType(metadata.type as Function)) {
      return this.createNotBuiltInTypeReference(
        key,
        metadata,
        schemas,
        schemaRefsStack
      );
    }
    const typeName = this.getTypeName(metadata.type as Type<unknown>);
    const itemType = this.swaggerTypesMapper.mapTypeToOpenAPIType(typeName);
    if (metadata.isArray) {
      return this.transformToArraySchemaProperty(metadata, key, {
        type: itemType
      });
    } else if (itemType === 'array') {
      const defaultOnArray = 'string';
      return this.transformToArraySchemaProperty(metadata, key, {
        type: defaultOnArray
      });
    }
    return {
      ...metadata,
      name: metadata.name || key,
      type: itemType
    };
  }

  createNotBuiltInTypeReference(
    key: string,
    metadata: SchemaObjectMetadata,
    schemas: SchemaObject[],
    schemaRefsStack: string[]
  ): BaseParameterObject & Record<string, any> {
    if (isUndefined(metadata.type)) {
      throw new Error(
        `A circular dependency has been detected (property key: "${key}"). Please, make sure that each side of a bidirectional relationships are using lazy resolvers ("type: () => ClassType").`
      );
    }
    let schemaObjectName = (metadata.type as Function).name;

    if (!includes(schemaRefsStack, schemaObjectName)) {
      schemaRefsStack.push(schemaObjectName);

      schemaObjectName = this.exploreModelSchema(
        metadata.type as Function,
        schemas,
        schemaRefsStack
      );
    }
    const $ref = getSchemaPath(schemaObjectName);
    if (metadata.isArray) {
      return this.transformToArraySchemaProperty(metadata, key, { $ref });
    }
    const keysToRemove = ['type', 'isArray'];
    const validMetadataObject = omit(metadata, keysToRemove);
    return ({
      ...validMetadataObject,
      name: metadata.name || key,
      $ref
    } as any) as BaseParameterObject;
  }

  transformToArraySchemaProperty(
    metadata: SchemaObjectMetadata,
    key: string,
    type: string | Record<string, any>
  ): BaseParameterObject & Record<string, any> {
    const keysToRemove = ['type', 'enum'];
    const schemaHost = {
      ...omit(metadata, keysToRemove),
      name: metadata.name || key,
      type: 'array',
      items: isString(type)
        ? {
            type
          }
        : { ...type }
    };
    schemaHost.items = omitBy(schemaHost.items, isUndefined);

    return (schemaHost as unknown) as BaseParameterObject & Record<string, any>;
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
    schemas: SchemaObject[],
    schemaRefsStack: string[] = []
  ) {
    const objLiteralKeys = Object.keys(literalObj);
    const properties = {};
    objLiteralKeys.forEach(key => {
      const propertyMetadata = this.mergePropertyWithMetadata(
        key,
        Object,
        schemas,
        schemaRefsStack,
        literalObj[key]
      );
      const keysToRemove = ['isArray', 'name'];
      const validMetadataObject = omit(propertyMetadata, keysToRemove);
      properties[key] = validMetadataObject;
    });
    return {
      name: key,
      type: 'object',
      properties
    };
  }

  private isArrayCtor(type: Type<unknown> | string): boolean {
    return type === Array;
  }

  private isPrimitiveType(type: Type<unknown> | string): boolean {
    return (
      isFunction(type) && [String, Boolean, Number].some(item => item === type)
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
}
