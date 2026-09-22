import { INestApplication } from '@nestjs/common';

export function getGlobalPrefix(app: INestApplication): string {
  const internalConfigRef = (app as any).config;
  return (internalConfigRef && internalConfigRef.getGlobalPrefix()) || '';
}

/**
 * Returns every global prefix registered on the application through
 * `app.setGlobalPrefix()`.
 *
 * `@nestjs/core` allows `setGlobalPrefix()` to be called with either a single
 * `string` or a `string[]` (to mount the application under more than one
 * prefix at once). `ApplicationConfig#getGlobalPrefixes()` exposes the full
 * list, but since it was only introduced alongside multi-prefix support,
 * this helper falls back to the older, single-prefix `getGlobalPrefix()`
 * getter when it isn't available, normalizing the result to an array
 * either way so callers never have to special-case either shape.
 *
 * @returns an array of prefixes, or an empty array when none were set.
 */
export function getGlobalPrefixes(app: INestApplication): string[] {
  const internalConfigRef = (app as any).config;
  if (!internalConfigRef) {
    return [];
  }
  if (typeof internalConfigRef.getGlobalPrefixes === 'function') {
    return internalConfigRef.getGlobalPrefixes() || [];
  }
  // Older `@nestjs/core` versions only expose the single-prefix getter.
  const prefix = internalConfigRef.getGlobalPrefix();
  return prefix ? [prefix] : [];
}
