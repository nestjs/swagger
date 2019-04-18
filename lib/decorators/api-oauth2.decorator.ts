import { ApiSecurity } from './api-security.decorator';

/**
 * @deprecated Use @ApiSecurity
 */
export const ApiOAuth2Auth = (scopes?: string[]) => {
  return ApiSecurity({ type: 'oauth2', name: 'oauth2', scopes });
};
