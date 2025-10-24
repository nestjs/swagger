export interface SwaggerUiOptions {
    initOAuth?: {
        clientId?: string;
        clientSecret?: string;
        realm?: string;
        appName?: string;
        scopeSeparator?: string;
        scopes?: string[];
        additionalQueryStringParams?: Record<string, string>;
        useBasicAuthenticationWithAccessCodeGrant?: boolean;
        usePkceWithAuthorizationCodeGrant?: boolean;
    };
    persistAuthorization?: boolean;
    [key: string]: any;
}
