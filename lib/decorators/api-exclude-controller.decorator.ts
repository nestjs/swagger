import { DECORATORS } from '../constants';
import { createMethodDecorator } from './helpers';

export function ApiExcludeController(disable = true): MethodDecorator {
  return createMethodDecorator(DECORATORS.API_EXCLUDE_CONTROLLER, {
    disable
  });
}
