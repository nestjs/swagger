import { DECORATORS } from '../constants';
import { createMethodDecorator } from './helpers';

export function ApiSummary(summary: string): MethodDecorator {
  return createMethodDecorator(DECORATORS.API_OPERATION_SUMMARY, { summary });
}
