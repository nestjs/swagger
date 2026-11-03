import { ApiResponseOptions } from '../decorators/api-response.decorator.js';
import { ParameterObject } from './open-api-spec.interface.js';

export const GLOBAL_PARAMETERS = Symbol.for('swagger/globalParameters');
export const GLOBAL_RESPONSES = Symbol.for('swagger/globalResponses');

export type GlobalParameters = ParameterObject[];
export type GlobalResponses = Record<
  string,
  Omit<ApiResponseOptions, 'status'>
>;

export interface GlobalMetadata {
  globalParameters?: GlobalParameters;
  globalResponses?: GlobalResponses;
}

/**
 * Global parameters and responses belong to the document config they were
 * declared on. Symbol keys survive `{ ...config }` and are never serialized.
 */
export interface GlobalMetadataHost {
  [GLOBAL_PARAMETERS]?: GlobalParameters;
  [GLOBAL_RESPONSES]?: GlobalResponses;
}
