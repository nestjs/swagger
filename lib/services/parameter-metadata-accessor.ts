import { Type } from '@nestjs/common';
import {
  PARAMTYPES_METADATA,
  ROUTE_ARGS_METADATA
} from '@nestjs/common/constants';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
import { isEmpty, mapValues, omitBy } from 'lodash';
import { ParameterLocation, SchemaObject } from '../interfaces/open-api-spec.interface';
import { reverseObjectKeys } from '../utils/reverse-object-keys.util';

interface ParamMetadata {
  index: number;
  data?: string | number | object;
}
type ParamsMetadata = Record<string, ParamMetadata>;

export interface ParamWithTypeMetadata {
  name?: string | number | object;
  type?: Type<unknown>;
  in?: ParameterLocation | 'body' | typeof PARAM_TOKEN_PLACEHOLDER;
  isArray?: boolean;
  items?: SchemaObject;
  required: true;
  enum?: unknown[];
  enumName?: string;
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
    const routeArgsMetadata: ParamsMetadata =
      Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        instance.constructor,
        method.name
      ) || {};

    const parametersWithType: ParamsWithType = mapValues(
      reverseObjectKeys(routeArgsMetadata),
      (param: ParamMetadata) => ({
        type: types[param.index],
        name: param.data,
        required: true
      })
    );
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
}
