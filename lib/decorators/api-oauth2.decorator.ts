import { ApiSecurity } from './api-security.decorator';

export function ApiOAuth2Auth(scopes: string[], name = 'oauth2') {
  return ApiSecurity(name, scopes);
}
