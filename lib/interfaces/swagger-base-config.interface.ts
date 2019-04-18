export type SecurityType = 'basic' | 'apiKey' | 'oauth2';

export interface BasicSecurity {
  type: 'basic';
  description?: string;
}

export interface ApiKeySecurity {
  type: 'apiKey';
  description?: string;
  name: string;
  in: 'query' | 'header';
}

export interface OAuth2ImplicitSecurity {
  type: 'oauth2';
  description?: string;
  flow: 'implicit';
  authorizationUrl: string;
  scopes?: { [scope: string]: string };
}

export interface OAuth2accessCodeSecurity {
  type: 'oauth2';
  description?: string;
  flow: 'accessCode';
  authorizationUrl: string;
  tokenUrl: string;
  scopes?: { [scope: string]: string };
}

export interface OAuth2ApplicationSecurity {
  type: 'oauth2';
  description?: string;
  flow: 'password' | 'application';
  tokenUrl: string;
  scopes?: { [scope: string]: string };
}

export type SecurityDefinitions =
  | BasicSecurity
  | ApiKeySecurity
  | OAuth2accessCodeSecurity
  | OAuth2ImplicitSecurity
  | OAuth2ApplicationSecurity;

export interface Tag {
  name: string;
  description?: string;
}

export interface SwaggerBaseConfig {
  swagger?: string;
  info?: {
    description?: string;
    version?: string;
    title?: string;
    termsOfService?: string;
    contact?: {
      email: string;
    };
    license?: {
      name: string;
      url: string;
    };
  };
  tags?: Tag[];
  host?: string;
  basePath?: string;
  externalDocs?: {
    description: string;
    url: string;
  };
  schemes?: SwaggerScheme[];
  securityDefinitions?: {
    [name: string]: SecurityDefinitions;
  };
}

export type SwaggerScheme = 'http' | 'https';
