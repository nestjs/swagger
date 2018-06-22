import { DECORATORS } from '../constants';
import { createMethodDecorator } from './helpers';

export const ApiExcludeEndpoint = (): MethodDecorator =>
  createMethodDecorator(DECORATORS.API_EXCLUDE_ENDPOINT, {
    disable: true
  });
