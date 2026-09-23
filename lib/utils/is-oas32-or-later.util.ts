import { isOasVersionAtLeast } from './is-oas-version-at-least.util.js';

export function isOas32OrLater(openApiVersion: string): boolean {
  return isOasVersionAtLeast(openApiVersion, 3, 2);
}
