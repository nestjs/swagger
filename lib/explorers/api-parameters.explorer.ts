import {
  PARAMTYPES_METADATA,
  ROUTE_ARGS_METADATA
} from '@nestjs/common/constants';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
import { isFunction, isUndefined } from '@nestjs/common/utils/shared.utils';
import {
  assign,
  find,
  flatMap,
  identity,
  includes,
  isEmpty,
  isNil,
  isString,
  keyBy,
  map,
  mapValues,
  negate,
  omit,
  omitBy,
  pickBy,
  unionWith
} from 'lodash';
import { DECORATORS } from '../constants';
import { SwaggerEnumType } from '../types/swagger-enum.type';

export const exploreApiParametersMetadata = (
  definitions,
  instance,
  prototype,
  method
) => {
  const implicitParameters: any[] = Reflect.getMetadata(
    DECORATORS.API_PARAMETERS,
    method
  );
  const reflectedParameters = exploreApiReflectedParametersMetadata(
    instance,
    prototype,
    method
  );
  const noAnyImplicit = isNil(implicitParameters);
  if (noAnyImplicit && isNil(reflectedParameters)) {
    return undefined;
  }

  const allReflectedParameters = transformModelToProperties(
    reflectedParameters || []
  );
  const mergedParameters = noAnyImplicit
    ? allReflectedParameters
    : map(allReflectedParameters, item =>
        assign(item, find(implicitParameters, ['name', item.name]))
      );

  const unionParameters = noAnyImplicit
    ? mergedParameters
    : unionWith(mergedParameters, implicitParameters, (arrVal, othVal) => {
        return arrVal.name === othVal.name && arrVal.in === othVal.in;
      });

  const paramsWithDefinitions = mapModelsToDefinitons(
    unionParameters,
    definitions
  );
  const parameters = mapParametersTypes(paramsWithDefinitions);

  return parameters ? { parameters } : undefined;
};

const DEFAULT_PARAM_TOKEN = '_';
const exploreApiReflectedParametersMetadata = (instance, prototype, method) => {
  const types = Reflect.getMetadata(PARAMTYPES_METADATA, instance, method.name);
  const parametersMetadata =
    Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      instance.constructor,
      method.name
    ) || {};
  const parametersWithType = mapValues(parametersMetadata, param => ({
    type: types[param.index],
    name: param.data,
    required: true
  }));
  const parameters = omitBy(
    mapValues(parametersWithType, (val, key) => ({
      ...val,
      in: mapParamType(key as any)
    })),
    val => val.in === DEFAULT_PARAM_TOKEN || (val.name && val.in === 'body')
  );
  return !isEmpty(parameters) ? parameters : undefined;
};

const exploreModelProperties = prototype => {
  const props =
    Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES_ARRAY, prototype) || [];
  return props
    .filter(isString)
    .filter(prop => prop.charAt(0) === ':' && !isFunction(prototype[prop]))
    .map(prop => prop.slice(1));
};

const isBodyParameter = param => param.in === 'body';

const transformModelToProperties = reflectedParameters => {
  return flatMap(reflectedParameters, (param: any) => {
    if (!param || param.type === Object) {
      return undefined;
    }
    const { prototype } = param.type;
    if (param.name) {
      return param;
    }
    if (isBodyParameter(param)) {
      const name: string =
        param.type && isFunction(param.type) ? param.type.name : param.type;
      return { ...param, name };
    }
    const modelProperties = exploreModelProperties(prototype);
    return modelProperties.map(key => {
      const reflectedParam =
        Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES, prototype, key) ||
        {};
      return {
        ...param,
        ...reflectedParam,
        name: key
      };
    });
  }).filter(identity);
};

const transformToArrayModelProperty = (metadata, key, type) => {
  const model = {
    ...metadata,
    name: key,
    type: 'array',
    items: {
      ...type
    }
  };

  if (metadata.enum !== undefined) {
    delete model.enum;
    model.items = {
      ...model.items,
      enum: metadata.enum
    };
  }
  return model;
};

export const exploreModelDefinition = (
  type,
  definitions,
  existingNestedModelNames = []
) => {
  const { prototype } = type;
  const modelProperties = exploreModelProperties(prototype);
  const propertiesWithType = modelProperties.map(key => {
    const metadata =
      Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES, prototype, key) ||
      {};

    const defaultTypes = [String, Boolean, Number, Object, Array];

    if (metadata.enum !== undefined) {
      metadata.enum = getEnumValues(metadata.enum);
    }
    const isNotDefaultType =
      isFunction(metadata.type) &&
      !defaultTypes.find(defaultType => defaultType === metadata.type);

    // Support for circular references by using a callback to resolve the dependent Model
    if (isFunction(metadata.type) && metadata.type.name == 'type') {
      metadata.type = metadata.type();
    }

    if (isNotDefaultType) {
      let nestedModelName = metadata.type.name;

      if (!includes(existingNestedModelNames, metadata.type.name)) {
        existingNestedModelNames.push(metadata.type.name);

        nestedModelName = exploreModelDefinition(
          metadata.type,
          definitions,
          existingNestedModelNames
        );
      }
      const $ref = getDefinitionPath(metadata.type.name);
      if (metadata.isArray) {
        return transformToArrayModelProperty(metadata, key, { $ref });
      }
      const strippedMetadata = omit(metadata, [
        'type',
        'isArray',
        'collectionFormat',
        'required'
      ]);
      if (Object.keys(strippedMetadata).length === 0) {
        return { name: key, required: metadata.required, $ref };
      }
      return {
        name: key,
        required: metadata.required,
        title: nestedModelName,
        allOf: [{ $ref }, strippedMetadata]
      };
    }

    const isRawSwagger = metadata.type.type && metadata.type.items;
    if (isRawSwagger) {
      const { type, items } = metadata.type;
      return Object.assign({}, metadata, { name: key, type, items });
    }

    const metatype: string =
      metadata.type && isFunction(metadata.type)
        ? metadata.type.name
        : metadata.type;
    const swaggerType = mapTypesToSwaggerTypes(metatype);
    const itemType = metadata.enum ? getEnumType(metadata.enum) : swaggerType;

    if (metadata.isArray) {
      return transformToArrayModelProperty(metadata, key, { type: itemType });
    } else if (swaggerType === 'array') {
      const defaultOnArray = 'string';
      return transformToArrayModelProperty(metadata, key, {
        type: defaultOnArray
      });
    } else {
      return {
        ...metadata,
        name: key,
        type: itemType
      };
    }
  });
  const typeDefinition = {
    type: 'object',
    properties: mapValues(keyBy(propertiesWithType, 'name'), property =>
      omit(property, ['name', 'isArray', 'required'])
    )
  };
  const typeDefinitionRequiredFields = propertiesWithType
    .filter(property => property.required != false)
    .map(property => property.name);
  if (typeDefinitionRequiredFields.length > 0) {
    typeDefinition['required'] = typeDefinitionRequiredFields;
  }
  definitions.push({
    [type.name]: typeDefinition
  });
  return type.name;
};

const formDataModelTransformation = type => {
  const { prototype } = type;
  if (!prototype) {
    return {};
  }
  const modelProperties = exploreModelProperties(prototype);
  const data = modelProperties.map(key => {
    const metadata =
      Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES, prototype, key) ||
      {};
    const defaultTypes = [String, Boolean, Number];
    if (defaultTypes.indexOf(metadata.type.name)) {
      return {
        name: key,
        type: metadata.type.name.toLowerCase(),
        required: metadata.required,
        in: 'formData'
      };
    }
  });
  return data;
};

const getEnumValues = (e: SwaggerEnumType): string[] | number[] => {
  if (Array.isArray(e)) {
    return e as string[];
  }
  if (typeof e !== 'object') {
    return [];
  }
  const values = [];
  const uniqueValues = {};

  for (const key in e) {
    const value = e[key];
    // Filter out cases where enum key also becomes its value (A: B, B: A)
    if (
      !uniqueValues.hasOwnProperty(value) &&
      !uniqueValues.hasOwnProperty(key)
    ) {
      values.push(value);
      uniqueValues[value] = value;
    }
  }
  return values;
};

const getEnumType = (values: (string | number)[]): 'string' | 'number' => {
  const hasString = values.filter(isString).length > 0;
  return hasString ? 'string' : 'number';
};

const mapParamType = (key: string): string => {
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
      return DEFAULT_PARAM_TOKEN;
  }
};

const hasSchemaDefinition = param => param.schema;
const omitParamType = param => omit(param, 'type');

const mapParametersTypes = parameters =>
  parameters.map(param => {
    if (hasSchemaDefinition(param)) {
      return omitParamType(param);
    }
    const { type } = param;
    const paramWithStringType: any = pickBy(
      {
        ...param,
        type:
          type && isFunction(type)
            ? mapTypesToSwaggerTypes(type.name)
            : mapTypesToSwaggerTypes(type)
      },
      negate(isUndefined)
    );
    if (paramWithStringType.isArray) {
      return {
        ...paramWithStringType,
        type: 'array',
        items: {
          type: mapTypesToSwaggerTypes(paramWithStringType.type)
        }
      };
    }
    return paramWithStringType;
  });

export const mapTypesToSwaggerTypes = (type: string) => {
  if (!(type && type.charAt)) {
    return '';
  }
  return type.charAt(0).toLowerCase() + type.slice(1);
};

const getDefinitionPath = modelName => `#/definitions/${modelName}`;

const mapModelsToDefinitons = (parameters, definitions) => {
  return parameters.map(param => {
    if (!isBodyParameter(param)) {
      return param;
    }
    const isFormData = param.in === 'formData';
    if (isFormData) {
      return formDataModelTransformation(param.type);
    }
    const defaultTypes = [String, Boolean, Number];
    if (
      isFunction(param.type) &&
      defaultTypes.some(defaultType => defaultType === param.type)
    ) {
      return param;
    }
    const modelName = exploreModelDefinition(param.type, definitions);
    const name = param.name ? param.name : modelName;
    const schema = {
      $ref: getDefinitionPath(modelName)
    };
    if (param.isArray) {
      return {
        ...param,
        name,
        schema: {
          type: 'array',
          items: schema
        }
      };
    }
    return {
      ...param,
      name,
      schema
    };
  });
};
