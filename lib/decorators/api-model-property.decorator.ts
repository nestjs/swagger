import { DECORATORS } from '../constants';
import { createMethodDecorator, createPropertyDecorator } from './helpers';
import { pickBy, isNil, negate, isUndefined } from 'lodash';

export const ApiModelProperty = (metadata: {
    description?: string;
    required?: boolean;
    type?: any;
    isArray?: boolean;
    enum?: string[];
    default?: any;
} = {}): PropertyDecorator => {
    return createPropertyDecorator(DECORATORS.API_MODEL_PROPERTIES, metadata);
};

export const ApiModelPropertyOptional = (metadata: {
    description?: string;
    type?: any;
    isArray?: boolean;
    enum?: string[]
    default?: any;
} = {}): PropertyDecorator => ApiModelProperty({
    ...metadata,
    required: false,
});