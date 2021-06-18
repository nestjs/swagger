import { Type } from '@nestjs/common';
import { assign, find, isNil, map, omitBy, some, unionWith } from 'lodash';
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
  const parametersMetadata = parameterMetadataAccessor.explore(
    instance,
    prototype,
    method
  );
  const noExplicitMetadata = isNil(explicitParameters);
  if (noExplicitMetadata && isNil(parametersMetadata)) {
    return undefined;
  }
  const reflectedParametersAsProperties = parametersMetadataMapper.transformModelToProperties(
    parametersMetadata || {}
  );

  let properties = reflectedParametersAsProperties;
  if (!noExplicitMetadata) {
    const mergeImplicitAndExplicit = (item: ParamWithTypeMetadata) =>
      assign(item, find(explicitParameters, ['name', item.name]));

    properties = removeBodyMetadataIfExplicitExists(
      properties,
      explicitParameters
    );
    properties = map(properties, mergeImplicitAndExplicit);
    properties = unionWith(properties, explicitParameters, (arrVal, othVal) => {
      return arrVal.name === othVal.name && arrVal.in === othVal.in;
    });
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
    return omitBy(
      properties,
      (p) => p.in === 'body'
    ) as ParamWithTypeMetadata[];
  }
  return properties;
}
