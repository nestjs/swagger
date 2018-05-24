import { DECORATORS } from '../constants';
import { createMethodDecorator } from './helpers';
import { pickBy, isNil, negate, isUndefined } from 'lodash';

export const ApiDisableEndpoint = (): MethodDecorator => {
  return createMethodDecorator(DECORATORS.API_DISABLE_ENDPOINT, {});
};
