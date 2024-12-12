import { DECORATORS } from '../constants';
import { createMixedDecorator } from './helpers';
import { CallBackObject } from '../interfaces/callback-object.interface';

export function ApiCallbacks(...callbackObject: Array<CallBackObject<any>>) {
  return createMixedDecorator(DECORATORS.API_CALLBACKS, callbackObject);
}
