import { DECORATORS } from '../constants';
import { createMixedDecorator } from './helpers';

export const ApiApiKeyAuth = () => {
  return createMixedDecorator(DECORATORS.API_APIKEY, []);
};
