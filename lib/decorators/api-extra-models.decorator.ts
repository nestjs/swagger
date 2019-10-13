import { DECORATORS } from '../constants';
import { createMixedDecorator } from './helpers';

export const ApiExtraModels = (...models: any[]) => {
  return createMixedDecorator(DECORATORS.API_EXTRA_MODELS, models);
};
