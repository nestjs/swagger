import { SwaggerBaseConfig } from './interfaces/swagger-base-config.interface';
export declare class DocumentBuilder {
  private readonly document;
  setTitle(title: string): this;
  setDescription(description: string): this;
  setVersion(version: string): this;
  setTermsOfService(termsOfService: string): this;
  setContactEmail(email: string): this;
  setLicense(name: string, url: string): this;
  setHost(host: string): this;
  setBasePath(basePath: string): this;
  setExternalDoc(description: string, url: string): this;
  setSchemes(...schemes: ('http' | 'https')[]): this;
  addTag(name: string, description?: string): this;
  addBearerAuth(
    name?: string,
    location?: 'header' | 'body' | 'query',
    type?: string
  ): this;
  addOAuth2(
    flow?: 'implicit' | 'password' | 'application' | 'accessCode',
    authorizationUrl?: string,
    tokenUrl?: string,
    scopes?: object
  ): this;
  build(): SwaggerBaseConfig;
}
