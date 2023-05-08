export const validateGlobalPrefix = (globalPrefix: string): boolean =>
  globalPrefix && !globalPrefix.match(/^(\/?)$/);
