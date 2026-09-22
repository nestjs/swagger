import { INestApplication } from '@nestjs/common';
import {
  getGlobalPrefix,
  getGlobalPrefixes
} from '../../lib/utils/get-global-prefix';

const asApp = (config: unknown): INestApplication =>
  ({ config }) as unknown as INestApplication;

describe('getGlobalPrefix', () => {
  it('returns the configured prefix', () => {
    const app = asApp({ getGlobalPrefix: () => 'api' });
    expect(getGlobalPrefix(app)).toEqual('api');
  });

  it('returns an empty string when no prefix was configured', () => {
    const app = asApp({ getGlobalPrefix: () => '' });
    expect(getGlobalPrefix(app)).toEqual('');
  });

  it('returns an empty string when the internal config is missing', () => {
    const app = asApp(undefined);
    expect(getGlobalPrefix(app)).toEqual('');
  });
});

describe('getGlobalPrefixes', () => {
  it('returns every prefix when the config exposes getGlobalPrefixes()', () => {
    const app = asApp({
      getGlobalPrefix: () => 'api',
      getGlobalPrefixes: () => ['api', 'v1']
    });
    expect(getGlobalPrefixes(app)).toEqual(['api', 'v1']);
  });

  it('returns an empty array when getGlobalPrefixes() reports none configured', () => {
    const app = asApp({
      getGlobalPrefix: () => '',
      getGlobalPrefixes: () => []
    });
    expect(getGlobalPrefixes(app)).toEqual([]);
  });

  // `getGlobalPrefixes()` was introduced on `ApplicationConfig` alongside
  // multi-prefix support. Older `@nestjs/core` versions only expose the
  // original, single-prefix `getGlobalPrefix()` getter.
  it('falls back to getGlobalPrefix() when the installed @nestjs/core has no getGlobalPrefixes()', () => {
    const app = asApp({ getGlobalPrefix: () => 'api' });
    expect(getGlobalPrefixes(app)).toEqual(['api']);
  });

  it('falls back to an empty array when the older getGlobalPrefix() has no value either', () => {
    const app = asApp({ getGlobalPrefix: () => '' });
    expect(getGlobalPrefixes(app)).toEqual([]);
  });

  it('returns an empty array when the internal config is missing entirely', () => {
    const app = asApp(undefined);
    expect(getGlobalPrefixes(app)).toEqual([]);
  });
});
