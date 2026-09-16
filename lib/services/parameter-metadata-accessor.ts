import { Type } from '@nestjs/common';
import {
  PARAMTYPES_METADATA,
  ROUTE_ARGS_METADATA
} from '@nestjs/common/constants.js';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum.js';
import { isEmpty, mapValues, omitBy } from 'es-toolkit/compat';
import { EnumSchemaAttributes } from '../interfaces/enum-schema-attributes.interface.js';
import {
  ParameterLocation,
  SchemaObject
} from '../interfaces/open-api-spec.interface.js';
import { StandardSchemaObject } from '../interfaces/swagger-document-options.interface.js';
import { reverseObjectKeys } from '../utils/reverse-object-keys.util.js';

interface ParamMetadata {
  index: number;
  data?: string | number | object;
  schema?: StandardSchemaObject;
  pipes?: any[];
}
type ParamsMetadata = Record<string, ParamMetadata>;

export interface ParamWithTypeMetadata {
  name?: string | number | object;
  type?: Type<unknown>;
  format?: string;
  in?: ParameterLocation | 'body' | typeof PARAM_TOKEN_PLACEHOLDER;
  standardSchema?: StandardSchemaObject;
  isArray?: boolean;
  items?: SchemaObject;
  required?: boolean;
  enum?: unknown[];
  enumName?: string;
  enumSchema?: EnumSchemaAttributes;
  selfRequired?: boolean;
}
export type ParamsWithType = Record<string, ParamWithTypeMetadata>;

const PARAM_TOKEN_PLACEHOLDER = 'placeholder';

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
      (param: ParamMetadata) => {
        const pipeInferences = this.inferFromPipes(param.pipes);
        const paramMetadata: ParamWithTypeMetadata = {
          type: pipeInferences.type ?? types[param.index],
          name: param.data,
          standardSchema: param.schema,
          required: true
        };
        if (pipeInferences.format) {
          paramMetadata.format = pipeInferences.format;
        }
        return paramMetadata;
      }
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

  private inferFromPipes(pipes?: any[]): { type?: Type<unknown>; format?: string } {
    if (!Array.isArray(pipes)) {
      return {};
    }
    for (const pipe of pipes) {
      const ctor = typeof pipe === 'function' ? pipe : pipe?.constructor;
      const name = ctor?.name;
      if (name === 'ParseUUIDPipe') {
        return { type: String as unknown as Type<unknown>, format: 'uuid' };
      }
      if (name === 'ParseIntPipe') {
        return { type: Number as unknown as Type<unknown> };
      }
      if (name === 'ParseFloatPipe') {
        return { type: Number as unknown as Type<unknown> };
      }
      if (name === 'ParseBoolPipe') {
        return { type: Boolean as unknown as Type<unknown> };
      }
    }
    return {};
  }
}
