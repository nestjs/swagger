import { ParamWithTypeMetadata } from '../services/parameter-metadata-accessor';

export function isBodyParameter(param: ParamWithTypeMetadata): boolean {
  return param.in === 'body';
}
