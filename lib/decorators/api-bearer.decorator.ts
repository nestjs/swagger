import { ApiSecurity } from './api-security.decorator';

/**
 * @deprecated Use @ApiSecurity
 */
export const ApiBearerAuth = () => {
  return ApiSecurity({ type: 'apiKey', name: 'bearer' });
};
