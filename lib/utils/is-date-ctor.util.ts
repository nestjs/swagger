import { Type } from '@nestjs/common';

export function isDateCtor(type: Type<unknown> | Function | string): boolean {
  return type === Date;
}
