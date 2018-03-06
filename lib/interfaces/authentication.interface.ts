
export interface AuthOptions {
    validatorUrl: string;
    oauth: {
        clientId: string;
        clientSecret: string;
        realm: string;
        appName: string;
        scopeSeparator: string;
        additionalQueryStringParams: Object;
    },
    docExpansion: 'full' | 'none' | 'list'

}