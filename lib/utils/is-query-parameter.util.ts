import { ParamWithTypeMetadata } from '../services/parameter-metadata-accessor';

export function isQueryParameter(param: ParamWithTypeMetadata): boolean {
  return param.in === 'query';
}
