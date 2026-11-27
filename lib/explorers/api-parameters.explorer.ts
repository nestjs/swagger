import { Type } from '@nestjs/common';
import assign from 'es-toolkit/compat/assign';
import find from 'es-toolkit/compat/find';
import isNil from 'es-toolkit/compat/isNil';
import map from 'es-toolkit/compat/map';
import omitBy from 'es-toolkit/compat/omitBy';
import some from 'es-toolkit/compat/some';
import unionWith from 'es-toolkit/compat/unionWith';
import uniq from 'es-toolkit/compat/uniq';
import { DECORATORS } from '../constants.js';
import { GlobalParameters } from '../interfaces/global-metadata.interface.js';
import { SchemaObject } from '../interfaces/open-api-spec.interface.js';
import { ModelPropertiesAccessor } from '../services/model-properties-accessor.js';
import {
  ParameterMetadataAccessor,
  ParamWithTypeMetadata
} from '../services/parameter-metadata-accessor.js';
import { ParametersMetadataMapper } from '../services/parameters-metadata-mapper.js';
import { SchemaObjectFactory } from '../services/schema-object-factory.js';
import { SwaggerTypesMapper } from '../services/swagger-types-mapper.js';
import { isSameParameter } from '../utils/is-same-parameter.util.js';

const parameterMetadataAccessor = new ParameterMetadataAccessor();
const modelPropertiesAccessor = new ModelPropertiesAccessor();
const parametersMetadataMapper = new ParametersMetadataMapper(
  modelPropertiesAccessor
);
const swaggerTypesMapper = new SwaggerTypesMapper();
export const exploreApiParametersMetadata = (
  schemas: Record<string, SchemaObject>,
  schemaObjectFactory: SchemaObjectFactory,
  globalParameters: GlobalParameters,
  instance: object,
  prototype: Type<unknown>,
  method: Function,
  metatype?: Type<unknown>
) => {
  const methodParameters: any[] = Reflect.getMetadata(
    DECORATORS.API_PARAMETERS,
    method
  );
  // Inherited methods are shared with the base, so read these from the class
  const classParameters: any[] =
    metatype && Reflect.getMetadata(DECORATORS.API_PARAMETERS, metatype);
  const explicitParameters =
    metatype && classParameters
      ? omitClassParamsRedeclaredByDerivedClass(
          uniq([...(methodParameters ?? []), ...classParameters]),
          metatype
        )
      : methodParameters;
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

  // Standard Schema params are still a single unnamed object at this point,
  // unlike class DTOs which `transformModelToProperties` has already fanned out
  // into one property per field. They have to be expanded before
  // `hasSameParameterIdentity` runs, or every one of them collides with the
  // others on `undefined === undefined` and only the last survives the merge.
  // `createFromModel` expands them too, for callers that reach it directly.
  let properties = reflectedParametersAsProperties.flatMap((param) => {
    const expanded = schemaObjectFactory.expandStandardSchemaParam(
      param,
      schemas
    );
    return expanded ?? [param];
  });
  if (!noExplicitAndGlobalMetadata) {
    // An explicit param (e.g. "@ApiQuery()") may replace the type of a model
    // property while keeping its default, so the default is pruned with the
    // reflected type before the two are merged
    const mergeImplicitAndExplicit = (item: ParamWithTypeMetadata) =>
      assign(
        schemaObjectFactory.pickDocumentedParamDefault(item),
        find(explicitParameters, (explicitParam) =>
          hasSameParameterIdentity(item, explicitParam)
        )
      );

    properties = removeBodyMetadataIfExplicitExists(
      properties,
      explicitParameters
    );
    properties = map(properties, mergeImplicitAndExplicit);
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

function hasSameParameterIdentity(
  left: { in?: string; name?: string | number | object },
  right: { in?: string; name?: string | number | object }
) {
  if (left.in === 'body' && right.in === 'body') {
    return true;
  }
  return isSameParameter(left, right);
}

/**
 * A class-level param is copied onto the route handlers its class declares,
 * so an inherited handler still carries the base class's copy, and the first
 * param found for a location and name wins. Left alone, the base class's
 * definition wins on the inherited routes while the subclass's own routes use
 * the subclass's definition. Drop the class-level params that a more derived
 * class redeclares. Params declared on the handler itself are kept, they still
 * win over class-level ones, and so is the precedence between two params
 * declared on one class.
 */
function omitClassParamsRedeclaredByDerivedClass(
  params: any[],
  metatype: Type<unknown>
) {
  // Class-level params declared on each class of the prototype chain,
  // most derived class first
  const paramsByClass: any[][] = [];
  for (
    let type = metatype;
    type && type !== Function.prototype;
    type = Object.getPrototypeOf(type)
  ) {
    const visible: any[] = Reflect.getMetadata(DECORATORS.API_PARAMETERS, type);
    const inherited: any[] = Reflect.getMetadata(
      DECORATORS.API_PARAMETERS,
      Object.getPrototypeOf(type)
    );
    paramsByClass.push(
      (visible ?? []).filter((param) => !inherited?.includes(param))
    );
  }
  const isRedeclaredByDerivedClass = (param: any) => {
    const declaredOn = paramsByClass.findIndex((classParams) =>
      classParams.includes(param)
    );
    // Not class-level: the handler declares this param itself
    if (declaredOn === -1) {
      return false;
    }
    return paramsByClass
      .slice(0, declaredOn)
      .some((classParams) =>
        classParams.some((classParam) =>
          hasSameParameterIdentity(classParam, param)
        )
      );
  };
  return params.filter((param) => !isRedeclaredByDerivedClass(param));
}

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
    return omitBy(
      properties,
      (p) => p.in === 'body'
    ) as ParamWithTypeMetadata[];
  }
  return properties;
}
