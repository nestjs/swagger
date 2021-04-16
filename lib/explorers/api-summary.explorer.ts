import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';

export const exploreApiSummaryMetadata = (
  instance: object,
  prototype: Type<unknown>,
  method: object
) => Reflect.getMetadata(DECORATORS.API_OPERATION_SUMMARY, method);
