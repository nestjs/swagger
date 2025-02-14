import { ApiSecurity } from './api-security.decorator';

/**
 * @publicApi
 */
export function ApiBasicAuth(name = 'basic') {
  return ApiSecurity(name);
}
