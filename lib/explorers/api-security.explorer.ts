import { DECORATORS } from '../constants';
import { SwaggerScanner } from '../swagger-scanner';

export const exploreGlobalApiSecurityMetadata = metatype => {
  const metadata = Reflect.getMetadata(DECORATORS.API_SECURITY, metatype);
  if (!metadata) return;

  const security = metadata.map(meta => {
    const scopes = meta.scopes || [];

    SwaggerScanner.addSecurity(meta.name, meta.type, scopes);
    return { [meta.name]: scopes };
  });
  return { security };
};

export const exploreApiSecurityMetadata = (instance, prototype, method) => {
  const metadata = Reflect.getMetadata(DECORATORS.API_SECURITY, method);
  if (!metadata) return;

  const security = metadata.map((obj, meta) => {
    const scopes = meta.scopes || [];

    SwaggerScanner.addSecurity(meta.name, meta.type, scopes);
    return { [meta.name]: scopes };
  });
  return { security };
};
