import { Logger } from '@nestjs/common';
import { isString, isUndefined, negate, pickBy } from 'lodash';
import { buildDocumentBase } from './fixtures/document.base';
import { OpenAPIObject } from './interfaces';
import {
  ExternalDocumentationObject,
  SecurityRequirementObject,
  SecuritySchemeObject,
  ServerVariableObject,
  TagObject
} from './interfaces/open-api-spec.interface';

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export class DocumentBuilder {
  private readonly logger = new Logger(DocumentBuilder.name);
  private readonly document: Omit<OpenAPIObject, 'paths'> = buildDocumentBase();

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

  public setContact(name: string, url: string, email: string): this {
    this.document.info.contact = { name, url, email };
    return this;
  }

  public setLicense(name: string, url: string): this {
    this.document.info.license = { name, url };
    return this;
  }

  public addServer(
    url: string,
    description?: string,
    variables?: Record<string, ServerVariableObject>
  ): this {
    this.document.servers.push({ url, description, variables });
    return this;
  }

  public setExternalDoc(description: string, url: string): this {
    this.document.externalDocs = { description, url };
    return this;
  }

  public setBasePath(path: string) {
    this.logger.warn(
      'The "setBasePath" method has been deprecated. Now, a global prefix is populated automatically. If you want to ignore it, take a look here: https://docs.nestjs.com/recipes/swagger#global-prefix. Alternatively, you can use "addServer" method to set up multiple different paths.'
    );
    return this;
  }

  public addTag(
    name: string,
    description = '',
    externalDocs?: ExternalDocumentationObject
  ): this {
    this.document.tags = this.document.tags.concat(
      pickBy(
        {
          name,
          description,
          externalDocs
        },
        negate(isUndefined)
      ) as TagObject
    );
    return this;
  }

  public addSecurity(name: string, options: SecuritySchemeObject): this {
    this.document.components.securitySchemes = {
      ...(this.document.components.securitySchemes || {}),
      [name]: options
    };
    return this;
  }

  public addSecurityRequirements(
    name: string | SecurityRequirementObject,
    requirements: string[] = []
  ): this {
    let securityRequirement: SecurityRequirementObject;

    if (isString(name)) {
      securityRequirement = { [name]: requirements };
    } else {
      securityRequirement = name;
    }

    this.document.security = (this.document.security || []).concat({
      ...securityRequirement
    });
    return this;
  }

  public addBearerAuth(
    options: Optional<SecuritySchemeObject, 'type'> = {},
    name = 'bearer'
  ): this {
    this.addSecurity(name, {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      ...options
    });
    return this;
  }

  public addOAuth2(
    options: Optional<SecuritySchemeObject, 'type'> = {},
    name = 'oauth2'
  ): this {
    this.addSecurity(name, {
      type: 'oauth2',
      flows: {},
      ...options
    });
    return this;
  }

  public addApiKey(
    options: Optional<SecuritySchemeObject, 'type'> = {},
    name = 'api_key'
  ): this {
    this.addSecurity(name, {
      type: 'apiKey',
      in: 'header',
      name,
      ...options
    });
    return this;
  }

  public addBasicAuth(
    options: Optional<SecuritySchemeObject, 'type'> = {},
    name = 'basic'
  ): this {
    this.addSecurity(name, {
      type: 'http',
      scheme: 'basic',
      ...options
    });
    return this;
  }

  public addCookieAuth(
    cookieName = 'connect.sid',
    options: Optional<SecuritySchemeObject, 'type'> = {},
    securityName = 'cookie'
  ): this {
    this.addSecurity(securityName, {
      type: 'apiKey',
      in: 'cookie',
      name: cookieName,
      ...options
    });
    return this;
  }

  public build(): Omit<OpenAPIObject, 'paths'> {
    return this.document;
  }
}
