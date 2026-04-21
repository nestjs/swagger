import { Type } from '@nestjs/common';
import {
  PARAMTYPES_METADATA,
  ROUTE_ARGS_METADATA
} from '@nestjs/common/constants';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
import { isEmpty, mapValues, omitBy } from 'lodash';
import { EnumSchemaAttributes } from '../interfaces/enum-schema-attributes.interface';
import {
  ParameterLocation,
  SchemaObject
} from '../interfaces/open-api-spec.interface';
import { reverseObjectKeys } from '../utils/reverse-object-keys.util';

interface ParamMetadata {
  index: number;
  data?: string | number | object;
  pipes?: unknown[];
}
type ParamsMetadata = Record<string, ParamMetadata>;

export interface ParamWithTypeMetadata {
  name?: string | number | object;
  type?: Type<unknown>;
  in?: ParameterLocation | 'body' | typeof PARAM_TOKEN_PLACEHOLDER;
  isArray?: boolean;
  items?: SchemaObject;
  required?: boolean;
  enum?: unknown[];
  enumName?: string;
  enumSchema?: EnumSchemaAttributes;
  selfRequired?: boolean;
  format?: string;
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
        const inferredFromPipes = this.inferSchemaFromPipes(param.pipes);
        return {
          type: inferredFromPipes?.type ?? types[param.index],
          name: param.data,
          required: true,
          ...(inferredFromPipes?.format
            ? { format: inferredFromPipes.format }
            : {})
        } as unknown as ParamWithTypeMetadata;
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

  /**
   * Attempts to infer the parameter type/format from the pipes applied
   * to the route argument decorator (e.g. `@Param('id', ParseUUIDPipe)`).
   *
   * Pipes can appear as either class references or instances, so both
   * shapes are checked. When no known pipe is detected, `undefined` is
   * returned so that the caller can fall back to the TypeScript-reflected
   * type.
   */
  private inferSchemaFromPipes(
    pipes: unknown[] | undefined
  ): { type?: Type<unknown>; format?: string } | undefined {
    if (!pipes || pipes.length === 0) {
      return undefined;
    }
    for (const pipe of pipes) {
      const pipeName = this.getPipeName(pipe);
      if (!pipeName) {
        continue;
      }
      if (pipeName === 'ParseUUIDPipe') {
        return { type: String as unknown as Type<unknown>, format: 'uuid' };
      }
    }
    return undefined;
  }

  private getPipeName(pipe: unknown): string | undefined {
    if (!pipe) {
      return undefined;
    }
    if (typeof pipe === 'function') {
      return (pipe as Function).name;
    }
    if (typeof pipe === 'object') {
      const ctor = (pipe as { constructor?: { name?: string } }).constructor;
      return ctor?.name;
    }
    return undefined;
  }
}
