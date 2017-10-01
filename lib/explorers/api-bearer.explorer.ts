import { DECORATORS } from '../constants';

export const exploreGlobalApiBearerMetadata = (metatype) => {
    const bearer = Reflect.getMetadata(DECORATORS.API_BEARER, metatype);
    return bearer ? { security: [{ bearer }] } : undefined;
};

export const exploreApiBearerMetadata = (instance, prototype, method) => {
    const bearer = Reflect.getMetadata(DECORATORS.API_BEARER, method);
    return bearer ? [{ bearer }] : undefined;
};