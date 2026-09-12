import { Type } from '@nestjs/common';
import {
  assign,
  find,
  flatMap,
  isNil,
  omitBy,
  some,
  unionWith
} from 'es-toolkit/compat';
import { DECORATORS } from '../constants.js';
import { SchemaObject } from '../interfaces/open-api-spec.interface.js';
import { ModelPropertiesAccessor } from '../services/model-properties-accessor.js';
import {
  ParameterMetadataAccessor,
  ParamWithTypeMetadata
} from '../services/parameter-metadata-accessor.js';
import { ParametersMetadataMapper } from '../services/parameters-metadata-mapper.js';
import { SchemaObjectFactory } from '../services/schema-object-factory.js';
import { SwaggerTypesMapper } from '../services/swagger-types-mapper.js';
import { GlobalParametersStorage } from '../storages/global-parameters.storage.js';
import { isBodyParameter } from '../utils/is-body-parameter.util.js';

const parameterMetadataAccessor = new ParameterMetadataAccessor();
const modelPropertiesAccessor = new ModelPropertiesAccessor();
const parametersMetadataMapper = new ParametersMetadataMapper(
  modelPropertiesAccessor
);
const swaggerTypesMapper = new SwaggerTypesMapper();
export const exploreApiParametersMetadata = (
  schemas: Record<string, SchemaObject>,
  schemaObjectFactory: SchemaObjectFactory,
  instance: object,
  prototype: Type<unknown>,
  method: Function
) => {
  const explicitParameters: any[] = Reflect.getMetadata(
    DECORATORS.API_PARAMETERS,
    method
  );
  const globalParameters = GlobalParametersStorage.getAll();
  const parametersMetadata = parameterMetadataAccessor.explore(
    instance,
    prototype,
    method
  );
  const noExplicitAndGlobalMetadata =
    isNil(explicitParameters) && isNil(globalParameters);
  if (noExplicitAndGlobalMetadata && isNil(parametersMetadata)) {
    return undefined;
  }
  const reflectedParametersAsProperties =
    parametersMetadataMapper.transformModelToProperties(
      parametersMetadata || {}
    );

  const expandedReflectedParameters = flatMap(
    reflectedParametersAsProperties,
    (param) => {
      if (param.standardSchema && !isBodyParameter(param)) {
        return schemaObjectFactory.createFromModel([param], schemas);
      }
      return param;
    }
  );

  let properties = expandedReflectedParameters;
  if (!noExplicitAndGlobalMetadata) {
    const hasSameParameterIdentity = (
      left: { in?: string; name?: string | number | object },
      right: { in?: string; name?: string | number | object }
    ) => {
      if (left.in === 'body' && right.in === 'body') {
        return true;
      }
      return left.name === right.name && left.in === right.in;
    };

    const mergeImplicitAndExplicit = (item: ParamWithTypeMetadata) => {
      const explicitParam = find(explicitParameters, (explicit) =>
        hasSameParameterIdentity(item, explicit)
      );
      if (!explicitParam) {
        return item;
      }
      const reflectedSchema = (item as any).schema;
      const { schema: _schema, ...restItem } = item as any;
      const merged = assign(restItem, explicitParam);
      if (reflectedSchema) {
        merged.schema = reflectedSchema;
      }
      return merged;
    };

    properties = removeBodyMetadataIfExplicitExists(
      properties,
      explicitParameters
    );
    properties = properties.map(mergeImplicitAndExplicit);
    properties = unionWith(
      properties,
      explicitParameters,
      globalParameters,
      (arrVal, othVal) => {
        return hasSameParameterIdentity(arrVal, othVal);
      }
    );
  }

  const paramsWithDefinitions = schemaObjectFactory.createFromModel(
    properties,
    schemas
  );
  const parameters = swaggerTypesMapper.mapParamTypes(paramsWithDefinitions);
  return parameters ? { parameters } : undefined;
};

function removeBodyMetadataIfExplicitExists(
  properties: ParamWithTypeMetadata[],
  explicitParams: any[]
) {
  const isBodyReflected = some(properties, (p) => p.in === 'body');
  const isBodyDefinedExplicitly = some(explicitParams, (p) => p.in === 'body');
  const hasReflectedBodyStandardSchema = some(
    properties,
    (p) => p.in === 'body' && !!p.standardSchema
  );

  if (
    isBodyReflected &&
    isBodyDefinedExplicitly &&
    !hasReflectedBodyStandardSchema
  ) {
    return properties.filter((p) => p.in !== 'body') as ParamWithTypeMetadata[];
  }
  return properties;
}
