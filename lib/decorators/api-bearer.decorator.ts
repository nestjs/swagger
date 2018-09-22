import { DECORATORS } from '../constants';
import { SwaggerBearerAuthOption } from '../interfaces/swagger-bearer-auth-options.interface';
import { createMixedDecorator } from './helpers';

export const ApiBearerAuth = (security: SwaggerBearerAuthOption) => {
  return createMixedDecorator(DECORATORS.API_BEARER, { security });
};
