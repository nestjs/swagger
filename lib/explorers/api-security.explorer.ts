import { DECORATORS } from '../constants';

export const exploreGlobalApiSecurityMetadata = metatype => {
  const bearer = Reflect.getMetadata(DECORATORS.API_BEARER, metatype);
  const oauth2 = Reflect.getMetadata(DECORATORS.API_OAUTH2, metatype);
  const basicAuth = Reflect.getMetadata(DECORATORS.API_BASIC, metatype);
  const apiKeyAuth = Reflect.getMetadata(DECORATORS.API_APIKEY, metatype);

  const security = [];
  bearer && security.push({ bearer });
  oauth2 && security.push({ oauth2 });
  basicAuth && security.push({ basicAuth });
  apiKeyAuth && security.push({ apiKeyAuth });

  return security.length > 0 ? { security } : undefined;
};

export const exploreApiSecurityMetadata = (instance, prototype, method) => {
  const bearer = Reflect.getMetadata(DECORATORS.API_BEARER, method);
  const oauth2 = Reflect.getMetadata(DECORATORS.API_OAUTH2, method);
  const basicAuth = Reflect.getMetadata(DECORATORS.API_BASIC, method);
  const apiKeyAuth = Reflect.getMetadata(DECORATORS.API_APIKEY, method);

  const security = [];
  bearer && security.push({ bearer });
  oauth2 && security.push({ oauth2 });
  basicAuth && security.push({ basicAuth });
  apiKeyAuth && security.push({ apiKeyAuth });

  return security.length > 0 ? security : undefined;
};
