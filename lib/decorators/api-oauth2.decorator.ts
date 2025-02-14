import { ApiSecurity } from './api-security.decorator';

/**
 * @publicApi
 */
export function ApiOAuth2(scopes: string[], name = 'oauth2') {
  return ApiSecurity(name, scopes);
}
