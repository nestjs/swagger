import { isOasVersionAtLeast } from './is-oas-version-at-least.util.js';

export function isOas31OrLater(openApiVersion: string): boolean {
  return isOasVersionAtLeast(openApiVersion, 3, 1);
}
