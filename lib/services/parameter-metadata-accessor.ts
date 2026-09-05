import { PipeTransform, Type } from '@nestjs/common';
import {
  PARAMTYPES_METADATA,
  ROUTE_ARGS_METADATA
} from '@nestjs/common/constants.js';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum.js';
import { ParseUUIDPipe } from '@nestjs/common/pipes/parse-uuid.pipe.js';
import { isEmpty, isFunction, mapValues, omitBy } from 'es-toolkit/compat';
import { EnumSchemaAttributes } from '../interfaces/enum-schema-attributes.interface.js';
import {
  ParameterLocation,
  SchemaObject
} from '../interfaces/open-api-spec.interface.js';
import { StandardSchemaObject } from '../interfaces/swagger-document-options.interface.js';
import { reverseObjectKeys } from '../utils/reverse-object-keys.util.js';

type ParamPipe = Type<PipeTransform> | PipeTransform;

interface ParamMetadata {
  index: number;
  data?: string | number | object;
  pipes?: ParamPipe[];
  schema?: StandardSchemaObject;
}
type ParamsMetadata = Record<string, ParamMetadata>;

export interface ParamWithTypeMetadata {
  name?: string | number | object;
  type?: Type<unknown>;
  in?: ParameterLocation | 'body' | typeof PARAM_TOKEN_PLACEHOLDER;
  standardSchema?: StandardSchemaObject;
  isArray?: boolean;
  items?: SchemaObject;
  format?: string;
  required?: boolean;
  enum?: unknown[];
  enumName?: string;
  enumSchema?: EnumSchemaAttributes;
  selfRequired?: boolean;
}
export type ParamsWithType = Record<string, ParamWithTypeMetadata>;

const PARAM_TOKEN_PLACEHOLDER = 'placeholder';

function isParseUUIDPipe(pipe: ParamPipe): boolean {
  return (
    pipe === ParseUUIDPipe ||
    pipe instanceof ParseUUIDPipe ||
    (isFunction(pipe) && pipe.prototype instanceof ParseUUIDPipe)
  );
}

export class ParameterMetadataAccessor {
  explore(
    instance: object,
    prototype: Type<unknown>,
    method: Function
  ): ParamsWithType {
    const types: Type<unknown>[] = Reflect.getMetadata(
      PARAMTYPES_METADATA,
      instance,
      method.name
    );
    if (!types?.length) {
      return undefined;
    }
    const routeArgsMetadata: ParamsMetadata =
      Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        instance.constructor,
        method.name
      ) || {};

    const parametersWithType: ParamsWithType = mapValues(
      reverseObjectKeys(routeArgsMetadata),
      (param: ParamMetadata) =>
        ({
          type: types[param.index],
          name: param.data,
          standardSchema: param.schema,
          required: true,
          ...this.inferSchemaFromPipes(types[param.index], param.pipes)
        }) as unknown as ParamWithTypeMetadata
    ) as unknown as ParamsWithType;
    const excludePredicate = (val: ParamWithTypeMetadata) =>
      val.in === PARAM_TOKEN_PLACEHOLDER || (val.name && val.in === 'body');

    const parameters = omitBy(
      mapValues(parametersWithType, (val, key) => ({
        ...val,
        in: this.mapParamType(key)
      })),
      excludePredicate as Function
    );
    return !isEmpty(parameters) ? (parameters as ParamsWithType) : undefined;
  }

  /**
   * Infers schema attributes that a bound pipe already guarantees, so that
   * they don't have to be repeated in an explicit `@ApiParam`/`@ApiQuery`.
   * Only string-typed parameters are considered, to avoid leaking the
   * inferred attributes onto the properties of a model-typed parameter.
   */
  private inferSchemaFromPipes(
    type: Type<unknown>,
    pipes: ParamPipe[] = []
  ): Pick<ParamWithTypeMetadata, 'format'> | undefined {
    if (type !== String || !pipes.some(isParseUUIDPipe)) {
      return undefined;
    }
    return { format: 'uuid' };
  }

  private mapParamType(key: string): string {
    const keyPair = key.split(':');
    switch (Number(keyPair[0])) {
      case RouteParamtypes.BODY:
        return 'body';
      case RouteParamtypes.PARAM:
        return 'path';
      case RouteParamtypes.QUERY:
        return 'query';
      case RouteParamtypes.HEADERS:
        return 'header';
      default:
        return PARAM_TOKEN_PLACEHOLDER;
    }
  }
}
