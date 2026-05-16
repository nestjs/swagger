import { ApiSecurity } from './api-security.decorator.js';

/**
 * @publicApi
 */
export function ApiBearerAuth(name = 'bearer') {
  return ApiSecurity(name);
}
