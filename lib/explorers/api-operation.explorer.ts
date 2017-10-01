import { DECORATORS } from '../constants';

export const exploreApiOperationMetadata = (instance, prototype, method) => {
    return Reflect.getMetadata(DECORATORS.API_OPERATION, method);
};