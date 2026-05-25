import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants.js';

export const exploreApiExcludeControllerMetadata = (metatype: Type<unknown>) =>
  Reflect.getMetadata(DECORATORS.API_EXCLUDE_CONTROLLER, metatype)?.[0] ===
  true;
