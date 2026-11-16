import { Type } from '@nestjs/common';
import { SchemaObject } from '../interfaces/open-api-spec.interface.js';

const TEMPORAL_STRING_FORMATS: Record<string, string | undefined> = {
  Instant: 'date-time',
  PlainDate: 'date',
  Duration: 'duration',
  ZonedDateTime: undefined,
  PlainDateTime: undefined,
  PlainTime: undefined,
  PlainYearMonth: undefined,
  PlainMonthDay: undefined
};

function getTemporalTypeName(
  type: Type<unknown> | Function | string
): string | undefined {
  const temporal = (globalThis as { Temporal?: Record<string, unknown> })
    .Temporal;
  if (!temporal || typeof type !== 'function') {
    return undefined;
  }
  return Object.keys(TEMPORAL_STRING_FORMATS).find(
    (name) => temporal[name] === type
  );
}

export function isDateCtor(type: Type<unknown> | Function | string): boolean {
  return type === Date || getTemporalTypeName(type) !== undefined;
}

export function getDateCtorSchema(
  type: Type<unknown> | Function | string
): SchemaObject {
  if (type === Date) {
    return { type: 'string', format: 'date-time' };
  }
  const format = TEMPORAL_STRING_FORMATS[getTemporalTypeName(type) ?? ''];
  if (format) {
    return { type: 'string', format };
  } else {
    return { type: 'string' };
  }
}
