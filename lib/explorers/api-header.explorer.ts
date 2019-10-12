import { DECORATORS } from '../constants';
import { HeaderMetadata } from '../decorators';

export const exploreGlobalApiHeaderMetadata = metatype => {
  const headers: HeaderMetadata = Reflect.getMetadata(
    DECORATORS.API_HEADER,
    metatype
  );
  return headers ? { headers } : undefined;
};
