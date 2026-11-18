import { Type } from '@nestjs/common';

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

export function getDateCtorFormat(
  type: Type<unknown> | Function | string
): string | undefined {
  if (type === Date) {
    return 'date-time';
  }
  return TEMPORAL_STRING_FORMATS[getTemporalTypeName(type) ?? ''];
}
