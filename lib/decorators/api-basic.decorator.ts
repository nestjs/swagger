import { ApiSecurity } from './api-security.decorator.js';

/**
 * @publicApi
 */
export function ApiBasicAuth(name = 'basic') {
  return ApiSecurity(name);
}
