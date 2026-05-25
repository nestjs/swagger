import { ParamWithTypeMetadata } from '../services/parameter-metadata-accessor.js';

export function isBodyParameter(param: ParamWithTypeMetadata): boolean {
  return param.in === 'body';
}
