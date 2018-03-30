import { DECORATORS } from '../constants';
import { createMixedDecorator } from './helpers';

export const ApiBearerAuth = () => {
  return createMixedDecorator(DECORATORS.API_BEARER, []);
};
