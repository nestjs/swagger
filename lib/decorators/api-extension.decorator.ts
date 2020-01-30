import { DECORATORS } from '../constants';
import { createMixedDecorator } from './helpers';

export function ApiExtension(extensionKey: string, extensionProperties: any) {
  //@TODO: We should validate that extensionKey is prefixed with 'x-'
  const extensionObject = {
    [extensionKey]: {
      ...extensionProperties
    }
  };

  return createMixedDecorator(DECORATORS.API_EXTENSION, extensionObject);
}
