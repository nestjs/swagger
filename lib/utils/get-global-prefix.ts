import { INestApplication } from '@nestjs/common';

export function getGlobalPrefix(app: INestApplication): string {
  const internalConfigRef = (app as any).config;
  return (internalConfigRef && internalConfigRef.getGlobalPrefix()) || '';
}
