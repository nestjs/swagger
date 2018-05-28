import { DECORATORS } from '../constants';
import { createMethodDecorator } from './helpers';
import { pickBy, isNil, negate, isUndefined } from 'lodash';

export const ApiExcludeEndpoint = (): MethodDecorator => {
  return createMethodDecorator(DECORATORS.API_EXCLUDE_ENDPOINT, {
    disable: true
  });
};
