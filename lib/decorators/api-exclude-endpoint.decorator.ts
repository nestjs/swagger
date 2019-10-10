import { DECORATORS } from '../constants';
import { createMethodDecorator } from './helpers';

export function ApiExcludeEndpoint(): MethodDecorator {
  return createMethodDecorator(DECORATORS.API_EXCLUDE_ENDPOINT, {
    disable: true
  });
}
