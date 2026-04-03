import { Type } from '@nestjs/common';
import { isNil, omit, clone } from 'lodash';
import { EnumSchemaAttributes } from '../interfaces/enum-schema-attributes.interface';
import {
  ParameterObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface';
import { SwaggerEnumType } from '../types/swagger-enum.type';
import { addEnumSchema, isEnumDefined } from '../utils/enum.utils';
import { createParamDecorator } from './helpers';

type ParameterOptions = Omit<ParameterObject, 'in' | 'schema'>;

interface ApiParamCommonMetadata extends ParameterOptions {
  type?: Type<unknown> | Function | [Function] | string;
  format?: string;
  enum?: SwaggerEnumType;
  enumName?: string;
  enumSchema?: EnumSchemaAttributes;
  // Allow passing custom OpenAPI extensions for parameters
  extensions?: Record<string, any>;
}

type ApiParamMetadata =
  | ApiParamCommonMetadata
  | (ApiParamCommonMetadata & {
      enumName: string;
      enumSchema?: EnumSchemaAttributes;
    });

interface ApiParamSchemaHost extends ParameterOptions {
  schema: SchemaObject;
}

export type ApiParamOptions = ApiParamMetadata | ApiParamSchemaHost;

const defaultParamOptions: ApiParamOptions = {
  name: '',
  required: true
};

/**
 * @publicApi
 */
export function ApiParam(
  options: ApiParamOptions
): MethodDecorator & ClassDecorator {
  const param: ApiParamMetadata & Record<string, any> = {
    name: isNil(options.name) ? defaultParamOptions.name : options.name,
    in: 'path',
    ...omit(options, ['enum', 'extensions'])
  };

  if (isEnumDefined(options)) {
    addEnumSchema(param, options);
  }

  // Merge custom OpenAPI extensions into parameter metadata.
  // Accept an `extensions` bag on the options similar to how `@ApiExtension` works.
  const extensions = (options as any).extensions as
    | Record<string, any>
    | undefined;
  if (extensions && typeof extensions === 'object') {
    const cloned = clone(extensions);
    for (const [key, value] of Object.entries(cloned)) {
      // Ensure extension keys are prefixed with 'x-'
      const extKey = key.startsWith('x-') ? key : `x-${key}`;
      param[extKey] = value;
    }
  }

  return createParamDecorator(param, defaultParamOptions);
}
