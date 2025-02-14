import { ApiSecurity } from './api-security.decorator';

/**
 * @publicApi
 */
export function ApiCookieAuth(name = 'cookie') {
  return ApiSecurity(name);
}
