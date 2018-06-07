import { DECORATORS } from '../constants';
import { isUndefined } from '@nestjs/common/utils/shared.utils';

export const exploreGlobalApiProducesMetadata = metatype => {
  const produces = Reflect.getMetadata(DECORATORS.API_PRODUCES, metatype);
  return produces ? { produces } : undefined;
};

export const exploreApiProducesMetadata = (instance, prototype, method) => {
  return Reflect.getMetadata(DECORATORS.API_PRODUCES, method);
};
