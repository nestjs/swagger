import { Type } from '@nestjs/common';
import {
  assign,
  find,
  isNil,
  map,
  omitBy,
  some,
  unionWith
} from 'es-toolkit/compat';
import { DECORATORS } from '../constants';
import { SchemaObject } from '../interfaces/open-api-spec.interface';
import { ModelPropertiesAccessor } from '../services/model-properties-accessor';
import {
  ParameterMetadataAccessor,
  ParamWithTypeMetadata
} from '../services/parameter-metadata-accessor';
import { ParametersMetadataMapper } from '../services/parameters-metadata-mapper';
import { SchemaObjectFactory } from '../services/schema-object-factory';
import { SwaggerTypesMapper } from '../services/swagger-types-mapper';
import { GlobalParametersStorage } from '../storages/global-parameters.storage';

const parameterMetadataAccessor = new ParameterMetadataAccessor();
const modelPropertiesAccessor = new ModelPropertiesAccessor();
const parametersMetadataMapper = new ParametersMetadataMapper(
  modelPropertiesAccessor
);
const swaggerTypesMapper = new SwaggerTypesMapper();
const schemaObjectFactory = new SchemaObjectFactory(
  modelPropertiesAccessor,
  swaggerTypesMapper
);

export const exploreApiParametersMetadata = (
  schemas: Record<string, SchemaObject>,
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

  let properties = reflectedParametersAsProperties;
  if (!noExplicitAndGlobalMetadata) {
    const mergeImplicitAndExplicit = (item: ParamWithTypeMetadata) =>
      assign(item, find(explicitParameters, ['name', item.name]));

    properties = map(
      removeBodyMetadataIfExplicitExists(properties, explicitParameters),
      mergeImplicitAndExplicit
    );
    properties = unionWith(
      properties,
      explicitParameters,
      globalParameters,
      (arrVal, othVal) => {
        return arrVal.name === othVal.name && arrVal.in === othVal.in;
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
  if (isBodyReflected && isBodyDefinedExplicitly) {
    return omitBy(properties, (p) => p.in === 'body');
  }
  return properties;
}
