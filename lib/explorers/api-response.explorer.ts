import { exploreModelDefinition, mapTypesToSwaggerTypes } from './api-parameters.explorer';
import { mapValues, omit } from 'lodash';

import { DECORATORS } from '../constants';
import { isFunction } from '@nestjs/common/utils/shared.utils';

export const exploreGlobalApiResponseMetadata = (definitions, metatype) => {
    const responses = Reflect.getMetadata(DECORATORS.API_RESPONSE, metatype);
    return responses ? {
        responses: mapResponsesToSwaggerResponses(responses, definitions),
    } : undefined;
};

export const exploreApiResponseMetadata = (definitions, instance, prototype, method) => {
    const responses = Reflect.getMetadata(DECORATORS.API_RESPONSE, method);
    if (!responses) {
        return undefined;
    }
    return mapResponsesToSwaggerResponses(responses, definitions);
};

const mapResponsesToSwaggerResponses = (responses, definitions) => mapValues(responses, (response) => {
    const { type, isArray } = response;
    response = omit(response, ['isArray']);
    // tslint:disable-next-line:curly
    if (!type) return response;
    const defaultTypes = [String, Boolean, Number, Object, Array];
    if (!(isFunction(type) && !defaultTypes.find((defaultType) => defaultType === type))) {
        const metatype: string = type && isFunction(type) ? type.name : type;
        const swaggerType = mapTypesToSwaggerTypes(metatype);

        return {
            ...response,
            schema: {
                type: swaggerType,
            },
        };
    }
    const name = exploreModelDefinition(type, definitions);
    if (isArray) {
        return toArrayResponseWithDefinition(response, name);
    }
    return toResponseWithDefinition(response, name);
});

export const toArrayResponseWithDefinition = (response, name) => ({
    ...response,
    schema: {
        type: 'array',
        items: {
            $ref: `#/definitions/${name}`,
        },
    },
});

export const toResponseWithDefinition = (response, name) => ({
    ...response,
    schema: {
        $ref: `#/definitions/${name}`,
    },
});