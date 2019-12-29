import { isFunction, isUndefined, omit, omitBy } from 'lodash';
import { BaseParameterObject } from '../interfaces/open-api-spec.interface';
import { ParamWithTypeMetadata } from './parameter-metadata-accessor';

export class SwaggerTypesMapper {
  mapParamTypes(
    parameters: Array<ParamWithTypeMetadata | BaseParameterObject>
  ): any {
    return parameters.map(param => {
      if (this.hasSchemaDefinition(param as BaseParameterObject)) {
        return this.omitParamType(param);
      }
      const { type } = param as ParamWithTypeMetadata;
      const typeName =
        type && isFunction(type)
          ? this.mapTypeToOpenAPIType(
              type.name === 'type' ? type().name : type.name
            )
          : this.mapTypeToOpenAPIType(type);

      const paramWithTypeMetadata = omitBy(
        {
          ...param,
          type: typeName
        },
        isUndefined
      );

      const keysToRemove = ['type', 'isArray', 'enum', 'items'];
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
            ...((param as BaseParameterObject).schema || {}),
            enum: paramWithTypeMetadata.enum,
            type: paramWithTypeMetadata.type
          },
          isUndefined
        )
      };
    });
  }

  mapTypeToOpenAPIType(type: string | Function): string {
    if (!(type && (type as string).charAt)) {
      return '';
    }
    return (type as string).charAt(0).toLowerCase() + (type as string).slice(1);
  }

  isEnumArrayType(param: Record<string, any>): boolean {
    return param.isArray && param.items && param.items.enum;
  }

  mapEnumArrayType(param: Record<string, any>, keysToRemove: string[]) {
    return {
      ...omit(param, keysToRemove),
      schema: {
        type: 'array',
        items: param.items
      }
    };
  }

  mapArrayType(param: ParamWithTypeMetadata, keysToRemove: string[]): any {
    const items = omitBy(
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
        type: 'array',
        items
      }
    };
  }

  hasSchemaDefinition(
    param: BaseParameterObject
  ): param is BaseParameterObject {
    return !!param.schema;
  }

  omitParamType(param: ParamWithTypeMetadata | BaseParameterObject) {
    return omit(param, 'type');
  }
}
