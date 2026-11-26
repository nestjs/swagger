import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants.js';
import { getClassParameters } from '../utils/get-class-parameters.util.js';

export const exploreGlobalApiHeaderMetadata = (metatype: Type<unknown>) => {
  const headers = getClassParameters(DECORATORS.API_HEADERS, metatype);
  return headers.length > 0
    ? { root: { parameters: headers }, depth: 1 }
    : undefined;
};
