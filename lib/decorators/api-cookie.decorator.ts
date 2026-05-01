import { ApiSecurity } from './api-security.decorator.js';

/**
 * @publicApi
 */
export function ApiCookieAuth(name = 'cookie') {
  return ApiSecurity(name);
}
