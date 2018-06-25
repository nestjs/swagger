import { DECORATORS } from '../constants';

export const exploreGlobalApiConsumesMetadata = metatype => {
  const consumes = Reflect.getMetadata(DECORATORS.API_CONSUMES, metatype);
  return consumes ? { consumes } : undefined;
};

export const exploreApiConsumesMetadata = (instance, prototype, method) => {
  return Reflect.getMetadata(DECORATORS.API_CONSUMES, method);
};
