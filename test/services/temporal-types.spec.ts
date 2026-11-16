import { ApiProperty } from '../../lib/decorators';
import { SchemaObject } from '../../lib/interfaces/open-api-spec.interface';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { ResponseObjectFactory } from '../../lib/services/response-object-factory';
import { SchemaObjectFactory } from '../../lib/services/schema-object-factory';
import { SwaggerTypesMapper } from '../../lib/services/swagger-types-mapper';

// Node versions before 26 have no global Temporal, so install stand-in classes
// when it is missing. The library only compares constructors by identity.
type TemporalNamespace = Record<string, Function>;
const globalWithTemporal = globalThis as { Temporal?: TemporalNamespace };
const hadNativeTemporal = globalWithTemporal.Temporal !== undefined;
const Temporal: TemporalNamespace = globalWithTemporal.Temporal ?? {
  Instant: class Instant {},
  ZonedDateTime: class ZonedDateTime {},
  PlainDate: class PlainDate {},
  PlainDateTime: class PlainDateTime {},
  PlainTime: class PlainTime {},
  PlainYearMonth: class PlainYearMonth {},
  PlainMonthDay: class PlainMonthDay {},
  Duration: class Duration {}
};

describe('Temporal types', () => {
  beforeAll(() => {
    globalWithTemporal.Temporal = Temporal;
  });

  afterAll(() => {
    if (!hadNativeTemporal) {
      delete globalWithTemporal.Temporal;
    }
  });

  describe('SchemaObjectFactory', () => {
    it('maps Temporal properties to string schemas', () => {
      class EventDto {
        @ApiProperty({ type: () => Temporal.Instant })
        createdAt: unknown;

        @ApiProperty({ type: () => Temporal.PlainDate })
        day: unknown;

        @ApiProperty({ type: () => Temporal.Duration })
        ttl: unknown;

        @ApiProperty({ type: () => Temporal.ZonedDateTime })
        zoned: unknown;

        @ApiProperty({ type: () => Temporal.PlainTime })
        startsAt: unknown;

        @ApiProperty({ type: () => [Temporal.Instant] })
        times: unknown;

        @ApiProperty({ type: () => Temporal.Instant, nullable: true })
        endedAt: unknown;
      }

      const schemaObjectFactory = new SchemaObjectFactory(
        new ModelPropertiesAccessor(),
        new SwaggerTypesMapper()
      );
      const schemas: Record<string, SchemaObject> = {};
      schemaObjectFactory.exploreModelSchema(EventDto, schemas);

      expect(Object.keys(schemas)).toEqual(['EventDto']);
      expect(schemas.EventDto.properties).toEqual({
        createdAt: { type: 'string', format: 'date-time' },
        day: { type: 'string', format: 'date' },
        ttl: { type: 'string', format: 'duration' },
        zoned: { type: 'string' },
        startsAt: { type: 'string' },
        times: {
          type: 'array',
          items: { type: 'string', format: 'date-time' }
        },
        endedAt: { type: 'string', format: 'date-time', nullable: true }
      });
    });
  });

  describe('ResponseObjectFactory', () => {
    it('maps a Temporal response type to a string schema', () => {
      const factory = new ResponseObjectFactory();
      const result = factory.create(
        { type: Temporal.Instant, description: 'OK' } as any,
        ['application/json'],
        {},
        { linkName: () => 'link', operationId: () => 'op' }
      ) as any;

      expect(result.content['application/json'].schema).toEqual({
        type: 'string',
        format: 'date-time'
      });
    });
  });
});
