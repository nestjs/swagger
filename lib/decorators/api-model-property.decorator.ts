import { DECORATORS } from '../constants';
import { createPropertyDecorator } from './helpers';
import { pickBy, isNil, negate, isUndefined } from 'lodash';

export const ApiModelProperty = (metadata: {
    description?: string;
    required?: boolean;
    type?: any;
    isArray?: boolean;
    default?: any;
    enum?: any;
    format?: string;
    example?: any;
    maximum?: number;
    exclusiveMaximum?: boolean;
    minimum?: number;
    exclusiveMinimum?: number;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    multipleOf?: number;
} = {}): PropertyDecorator => {
    return createPropertyDecorator(DECORATORS.API_MODEL_PROPERTIES, metadata);
};

export const ApiModelPropertyOptional = (metadata: {
    description?: string;
    type?: any;
    isArray?: boolean;
    default?: any;
    enum?: any;
    format?: string;
    example?: any;
    maximum?: number;
    exclusiveMaximum?: boolean;
    minimum?: number;
    exclusiveMinimum?: number;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    multipleOf?: number;
} = {}): PropertyDecorator => ApiModelProperty({
    ...metadata,
    required: false,
});