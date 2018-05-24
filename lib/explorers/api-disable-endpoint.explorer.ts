import { DECORATORS } from '../constants';

export const exploreApiDisableEndpointMetadata = (
  instance,
  prototype,
  method
) => {
  return Reflect.getMetadata(DECORATORS.API_DISABLE_ENDPOINT, method);
};
