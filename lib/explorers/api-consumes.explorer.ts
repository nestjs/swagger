import { DECORATORS } from '../constants';

const defaultConsumes = 'application/json';

export const exploreGlobalApiConsumesMetadata = (metatype) => {
    const consumes = Reflect.getMetadata(DECORATORS.API_CONSUMES, metatype);
    return consumes ? { consumes } : {
        consumes: [defaultConsumes],
    };
};

export const exploreApiConsumesMetadata = (instance, prototype, method) => {
    return Reflect.getMetadata(DECORATORS.API_CONSUMES, method) || [defaultConsumes];
};