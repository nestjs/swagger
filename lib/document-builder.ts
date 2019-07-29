import {
  SwaggerBaseConfig,
  SwaggerScheme
} from './interfaces/swagger-base-config.interface';

import { buildDocumentBase } from './fixtures/document.base';

export class DocumentBuilder {
  private readonly document: SwaggerBaseConfig = buildDocumentBase();

  public setTitle(title: string): this {
    this.document.info.title = title;
    return this;
  }

  public setDescription(description: string): this {
    this.document.info.description = description;
    return this;
  }

  public setVersion(version: string): this {
    this.document.info.version = version;
    return this;
  }

  public setTermsOfService(termsOfService: string): this {
    this.document.info.termsOfService = termsOfService;
    return this;
  }

  public setContactEmail(email: string): this {
    this.document.info.contact = { email };
    return this;
  }

  public setLicense(name: string, url: string): this {
    this.document.info.license = { name, url };
    return this;
  }

  public setHost(host: string): this {
    this.document.host = host;
    return this;
  }

  public setBasePath(basePath: string): this {
    this.document.basePath = basePath.startsWith('/')
      ? basePath
      : '/' + basePath;
    return this;
  }

  public setExternalDoc(description: string, url: string): this {
    this.document.externalDocs = { description, url };
    return this;
  }

  public setSchemes(...schemes: ('http' | 'https')[]): this {
    this.document.schemes = schemes as SwaggerScheme[];
    return this;
  }

  public addTag(name: string, description: string = ''): this {
    this.document.tags = this.document.tags.concat({ name, description });
    return this;
  }

  public addBearerAuth(
    name: string = 'Authorization',
    location: 'header' | 'body' | 'query' = 'header',
    type: string = 'apiKey'
  ): this {
    this.document.securityDefinitions = {
      ...(this.document.securityDefinitions || {}),
      bearer: {
        type,
        name,
        in: location
      }
    };
    return this;
  }

  public addOAuth2(
    flow: 'implicit' | 'password' | 'application' | 'accessCode' = 'password',
    authorizationUrl?: string,
    tokenUrl?: string,
    scopes?: object
  ): this {
    this.document.securityDefinitions = {
      ...(this.document.securityDefinitions || {}),
      oauth2: {
        type: 'oauth2',
        flow,
        authorizationUrl,
        tokenUrl,
        scopes
      }
    };
    return this;
  }

  public addBasicAuth(): this {
    this.document.securityDefinitions = {
      ...(this.document.securityDefinitions || {}),
      basic: {
        type: 'basic'
      }
    };
    return this;
  }

  public build(): SwaggerBaseConfig {
    return this.document;
  }
}
