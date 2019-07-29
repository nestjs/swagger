import { DECORATORS } from '../constants';
import { createMixedDecorator } from './helpers';

export const ApiBasicAuth = () => {
  return createMixedDecorator(DECORATORS.API_BASIC, []);
};
