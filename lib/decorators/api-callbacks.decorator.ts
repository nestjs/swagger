import { DECORATORS } from '../constants.js';
import { createMixedDecorator } from './helpers.js';
import { CallBackObject } from '../interfaces/callback-object.interface.js';

/**
 * @publicApi
 */
export function ApiCallbacks(...callbackObject: Array<CallBackObject<any>>) {
  return createMixedDecorator(DECORATORS.API_CALLBACKS, callbackObject);
}
