export const appControllerTemporalText = `import { Controller, Get } from '@nestjs/common';

declare global {
  namespace Temporal {
    interface Instant { readonly epochMilliseconds: number; }
    interface PlainDate { readonly year: number; }
  }
}

@Controller('events')
export class EventsController {
  @Get('days')
  async findDays(): Promise<Temporal.PlainDate[]> {
    return [];
  }

  @Get('latest')
  findLatest(): Temporal.Instant {
    return null;
  }
}
`;
