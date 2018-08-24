import { DECORATORS } from '../constants';

export const exploreApiExcludeEndpointMetadata = (
  instance,
  prototype,
  method
) => {
  return Reflect.getMetadata(DECORATORS.API_EXCLUDE_ENDPOINT, method);
};
