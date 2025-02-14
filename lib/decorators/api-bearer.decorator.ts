import { ApiSecurity } from './api-security.decorator';

/**
 * @publicApi
 */
export function ApiBearerAuth(name = 'bearer') {
  return ApiSecurity(name);
}
