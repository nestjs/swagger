export const temporalDtoText = `
declare global {
  namespace Temporal {
    interface Instant { readonly epochMilliseconds: number; }
    interface PlainDate { readonly year: number; }
    interface Duration { readonly hours: number; }
  }
}

export class EventDto {
  createdAt: Temporal.Instant;
  day: Temporal.PlainDate;
  ttl: Temporal.Duration;
  times: Temporal.Instant[];
  endedAt: Temporal.Instant | null;
}
`;
