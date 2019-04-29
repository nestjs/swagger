import { DECORATORS } from '../constants';

export interface BasicMetadata {
  name?: string;
  type: 'basic';
}

export interface APIKeyMetadata {
  name?: string;
  type: 'apiKey';
}

export interface OAuth2Metadata {
  name?: string;
  type: 'oauth2';
  scopes?: string[];
}

export type SecurityMetadata = BasicMetadata | APIKeyMetadata | OAuth2Metadata;

export const ApiSecurity = (metadata: SecurityMetadata) => {
  if (!metadata.name) {
    metadata.name = metadata.type;
  }

  return (target, key?, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      const securities =
        Reflect.getMetadata(DECORATORS.API_SECURITY, descriptor.value) || [];
      Reflect.defineMetadata(
        DECORATORS.API_SECURITY,
        [...securities, metadata],
        descriptor.value
      );
      return descriptor;
    }
    const securities =
      Reflect.getMetadata(DECORATORS.API_SECURITY, target) || [];
    Reflect.defineMetadata(
      DECORATORS.API_SECURITY,
      [...securities, metadata],
      target
    );
    return target;
  };
};
