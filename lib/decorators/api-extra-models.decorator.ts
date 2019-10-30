import { DECORATORS } from '../constants';
import { createMixedDecorator } from './helpers';

export function ApiExtraModels(...models: Function[]) {
  return createMixedDecorator(DECORATORS.API_EXTRA_MODELS, models);
}
