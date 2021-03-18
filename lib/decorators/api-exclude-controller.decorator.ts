import { String } from 'lodash';
import { DECORATORS } from '../constants';
import { createClassDecorator, createMethodDecorator } from './helpers';

export function ApiExcludeController(disable: boolean): ClassDecorator {
  return createClassDecorator(DECORATORS.API_EXCLUDE_CONTROLLER, [disable]);
}
