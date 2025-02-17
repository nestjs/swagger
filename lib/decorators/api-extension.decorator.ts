import { DECORATORS } from '../constants';
import { createMixedDecorator } from './helpers';
import { clone } from 'lodash';

/**
 * @publicApi
 */
export function ApiExtension(extensionKey: string, extensionProperties: any) {
  if (!extensionKey.startsWith('x-')) {
    throw new Error(
      'Extension key is not prefixed. Please ensure you prefix it with `x-`.'
    );
  }

  const extensionObject = {
    [extensionKey]: clone(extensionProperties)
  };

  return createMixedDecorator(DECORATORS.API_EXTENSION, extensionObject);
}
