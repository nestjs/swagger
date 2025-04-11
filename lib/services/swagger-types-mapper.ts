import { isFunction, isString, isUndefined, omit, omitBy, pick } from 'lodash';
import { ApiPropertyOptions } from '../decorators';
import {
  BaseParameterObject,
  ReferenceObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface';
import { ParamWithTypeMetadata } from './parameter-metadata-accessor';

type KeysToRemove =
  | keyof ApiPropertyOptions
  | '$ref'
  | 'properties'
  | 'enumName'
  | 'enumSchema'
  | 'selfRequired';

export class SwaggerTypesMapper {
  private readonly keysToRemove: Array<KeysToRemove> = [
    'isArray',
    'enum',
    'enumName',
    'enumSchema',
    '$ref',
    'selfRequired',
    ...this.getSchemaOptionsKeys()
  ];

  mapParamTypes(
    parameters: Array<ParamWithTypeMetadata | BaseParameterObject>
  ) {
    return parameters.map((param) => {
      if (
        this.hasSchemaDefinition(param as BaseParameterObject) ||
        this.hasRawContentDefinition(param)
      ) {
        if (Array.isArray(param.required) && 'schema' in param) {
          (param.schema as SchemaObject).required = param.required;
          delete param.required;
        }
        if ('selfRequired' in param) {
          param.required = param.selfRequired;
        }
        return this.omitParamKeys(param);
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

      if (this.isEnumArrayType(paramWithTypeMetadata)) {
        return this.mapEnumArrayType(
          paramWithTypeMetadata as ParamWithTypeMetadata,
          this.keysToRemove
        );
      } else if (paramWithTypeMetadata.isArray) {
        return this.mapArrayType(
          paramWithTypeMetadata as ParamWithTypeMetadata,
          this.keysToRemove
        );
      }
      return {
        ...omit(param, this.keysToRemove),
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

  mapEnumArrayType(param: Record<string, any>, keysToRemove: KeysToRemove[]) {
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
    keysToRemove: KeysToRemove[]
  ) {
    const itemsModifierKeys = ['format', 'maximum', 'minimum', 'pattern'];
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
    const modifierProperties = pick(param, itemsModifierKeys);
    return {
      ...omit(param, keysToRemove),
      schema: {
        ...omit(this.getSchemaOptions(param), [...itemsModifierKeys]),
        type: 'array',
        items: isString((items as any).type)
          ? { type: (items as any).type, ...modifierProperties }
          : { ...(items as any).type, ...modifierProperties }
      }
    };
  }

  getSchemaOptionsKeys(): Array<keyof SchemaObject> {
    return [
      'properties',
      'patternProperties',
      'additionalProperties',
      'minimum',
      'maximum',
      'maxProperties',
      'minItems',
      'minProperties',
      'maxItems',
      'minLength',
      'maxLength',
      'exclusiveMaximum',
      'exclusiveMinimum',
      'uniqueItems',
      'title',
      'format',
      'pattern',
      'nullable',
      'default',
      'example',
      'oneOf',
      'anyOf',
      'type',
      'items'
    ];
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

  private hasRawContentDefinition(param: BaseParameterObject) {
    return 'content' in param;
  }

  private omitParamKeys(param: ParamWithTypeMetadata | BaseParameterObject) {
    return omit(param, this.keysToRemove);
  }
}
