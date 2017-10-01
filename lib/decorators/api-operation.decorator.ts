import { DECORATORS } from '../constants';
import { createMethodDecorator } from './helpers';
import { pickBy, isNil, negate, isUndefined } from 'lodash';

const initialMetadata = {
    summary: '',
};

export const ApiOperation = (metadata: {
    title: string;
    description?: string;
    operationId?: string;
}): MethodDecorator => {
    return createMethodDecorator(DECORATORS.API_OPERATION, pickBy({
        ...initialMetadata,
        summary: isNil(metadata.title) ? initialMetadata.summary : metadata.title,
        description: metadata.description,
        operationId: metadata.operationId,
    }, negate(isUndefined)));
};