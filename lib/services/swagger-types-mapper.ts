import { isFunction, isUndefined, omit, omitBy } from 'lodash';
import { ApiPropertyOptions } from '../decorators';
import {
  BaseParameterObject,
  ReferenceObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface';
import { ParamWithTypeMetadata } from './parameter-metadata-accessor';

export class SwaggerTypesMapper {
  mapParamTypes(
    parameters: Array<ParamWithTypeMetadata | BaseParameterObject>
  ) {
    return parameters.map((param) => {
      if (this.hasSchemaDefinition(param as BaseParameterObject)) {
        return this.omitParamType(param);
      }
      const { type } = param as ParamWithTypeMetadata;
      const typeName =
        type && isFunction(type)
          ? this.mapTypeToOpenAPIType(type.name)
          : this.mapTypeToOpenAPIType(type);

      const paramWithTypeMetadata = omitBy(
        {
          ...param,
          type: typeName
        },
        isUndefined
      );

      const keysToRemove: Array<keyof ApiPropertyOptions | '$ref'> = [
        'type',
        'isArray',
        'enum',
        'items',
        '$ref',
        ...this.getSchemaOptionsKeys()
      ];
      if (this.isEnumArrayType(paramWithTypeMetadata)) {
        return this.mapEnumArrayType(
          paramWithTypeMetadata as ParamWithTypeMetadata,
          keysToRemove
        );
      } else if (paramWithTypeMetadata.isArray) {
        return this.mapArrayType(
          paramWithTypeMetadata as ParamWithTypeMetadata,
          keysToRemove
        );
      }
      return {
        ...omit(param, keysToRemove),
        schema: omitBy(
          {
            ...this.getSchemaOptions(param),
            ...((param as BaseParameterObject).schema || {}),
            enum: paramWithTypeMetadata.enum,
            type: paramWithTypeMetadata.type,
            $ref: (paramWithTypeMetadata as ReferenceObject).$ref
          },
          isUndefined
        )
      };
    });
  }

  mapTypeToOpenAPIType(type: string | Function): string {
    if (!(type && (type as string).charAt)) {
      return;
    }
    return (type as string).charAt(0).toLowerCase() + (type as string).slice(1);
  }

  mapEnumArrayType(
    param: Record<string, any>,
    keysToRemove: Array<keyof ApiPropertyOptions | '$ref'>
  ) {
    return {
      ...omit(param, keysToRemove),
      schema: {
        ...this.getSchemaOptions(param),
        type: 'array',
        items: param.items
      }
    };
  }

  mapArrayType(
    param: (ParamWithTypeMetadata & SchemaObject) | BaseParameterObject,
    keysToRemove: Array<keyof ApiPropertyOptions | '$ref'>
  ) {
    const items =
      (param as SchemaObject).items ||
      omitBy(
        {
          ...((param as BaseParameterObject).schema || {}),
          enum: (param as ParamWithTypeMetadata).enum,
          type: this.mapTypeToOpenAPIType((param as ParamWithTypeMetadata).type)
        },
        isUndefined
      );
    return {
      ...omit(param, keysToRemove),
      schema: {
        ...this.getSchemaOptions(param),
        type: 'array',
        items
      }
    };
  }

  private getSchemaOptions(param: Record<string, any>): Partial<SchemaObject> {
    const schemaKeys = this.getSchemaOptionsKeys();
    const optionsObject: Partial<SchemaObject> = schemaKeys.reduce(
      (acc, key) => ({
        ...acc,
        [key]: param[key]
      }),
      {}
    );
    return omitBy(optionsObject, isUndefined);
  }

  private isEnumArrayType(param: Record<string, any>): boolean {
    return param.isArray && param.items && param.items.enum;
  }

  private hasSchemaDefinition(
    param: BaseParameterObject
  ): param is BaseParameterObject {
    return !!param.schema;
  }

  private omitParamType(param: ParamWithTypeMetadata | BaseParameterObject) {
    return omit(param, 'type');
  }

  private getSchemaOptionsKeys(): Array<keyof SchemaObject> {
    return [
      'additionalProperties',
      'minimum',
      'maximum',
      'maxProperties',
      'minItems',
      'minProperties',
      'maxItems',
      'exclusiveMaximum',
      'exclusiveMinimum',
      'uniqueItems',
      'title',
      'format',
      'pattern',
      'default'
    ];
  }
}
