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
  tags?: {
    name: string;
    description: string;
  }[];
  host?: string;
  basePath?: string;
  externalDocs?: {
    description: string;
    url: string;
  };
  schemes?: SwaggerScheme[];
  securityDefinitions?: {
    basicAuth?: {
      type: 'basic';
    };
    apiKeyAuth?: {
      type: 'apiKey';
      name: string;
      in: 'query' | 'header';
    };
    bearer?: {
      type: string;
      name: string;
      in: 'body' | 'query' | 'header';
    };
    oauth2?: {
      type: 'oauth2';
      flow: 'implicit' | 'password' | 'application' | 'accessCode';
      authorizationUrl?: string;
      tokenUrl?: string;
      scopes?: object;
    };
  };
}

export type SwaggerScheme = 'http' | 'https';
