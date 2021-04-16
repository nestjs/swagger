import { DECORATORS } from '../constants';
import { createMethodDecorator } from './helpers';

export function ApiDescription(description: string): MethodDecorator {
  return createMethodDecorator(DECORATORS.API_OPERATION_DESCRIPTION, {
    description
  });
}
