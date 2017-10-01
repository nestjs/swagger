import { DECORATORS } from '../constants';
import { createMethodDecorator, createParamDecorator } from './helpers';
import { omit, pickBy, negate, isUndefined, isNil } from 'lodash';

const initialMetadata = {
    name: '',
    required: true,
};

export const ApiImplicitHeader = (metadata: {
    name: string;
    description?: string;
    required?: boolean;
}): MethodDecorator => {
    const param = {
        name: isNil(metadata.name) ? initialMetadata.name : metadata.name,
        in: 'header',
        description: metadata.description,
        required: metadata.required,
        type: String,
    };
    return createParamDecorator(param, initialMetadata);
};