export interface SwaggerBaseConfig {
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
      name: string,
      description: string,
    }[];
    host?: string;
    basePath?: string;
    externalDocs?: {
        description: string;
        url: string;
    };
    schemes?: SwaggerScheme[];
    securityDefinitions?: {
      bearer: {
        type: 'apiKey',
        name: string,
        in: 'body' | 'query' | 'header',
      },
    };
}

export type SwaggerScheme = 'http' | 'https';