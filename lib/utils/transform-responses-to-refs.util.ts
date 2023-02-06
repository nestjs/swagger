import { mapValues } from 'lodash';
import { ApiResponseOptions } from '../decorators';
import { ReferenceObject } from '../interfaces/open-api-spec.interface';

export function transformResponsesToRefs(
  globalResponses: Record<string, ApiResponseOptions>
): Record<string, ReferenceObject> {
  return mapValues(globalResponses, (value, key) => ({
    $ref: `#/components/responses/${key}`
  }));
}
