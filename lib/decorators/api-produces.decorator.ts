import { DECORATORS } from '../constants';
import { createMixedDecorator } from './helpers';

export const ApiProduces = (...mimeTypes: string[]) => {
  return createMixedDecorator(DECORATORS.API_PRODUCES, mimeTypes);
};
