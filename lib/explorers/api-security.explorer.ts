import { DECORATORS } from '../constants';

export const exploreGlobalApiSecurityMetadata = (metatype) => {
    const bearer = Reflect.getMetadata(DECORATORS.API_BEARER, metatype);
    const oauth2 = Reflect.getMetadata(DECORATORS.API_OAUTH2, metatype);
    const security = [];
    if (bearer) {
        security.push({bearer});
    }
    if (oauth2) {
        security.push({oauth2});
    }
    return security.length > 0 ? { security } : undefined;
};

export const exploreApiSecurityMetadata = (instance, prototype, method) => {
    const bearer = Reflect.getMetadata(DECORATORS.API_BEARER, method);
    const oauth2 = Reflect.getMetadata(DECORATORS.API_OAUTH2, method);
    const security = [];
    if (bearer) {
        security.push({bearer});
    }
    if (oauth2) {
        security.push({oauth2});
    }
    return oauth2 ? security : undefined;
};