import { Logger } from '@nestjs/common';
import { clone, isString, isUndefined, negate, pickBy } from 'lodash';
import { buildDocumentBase } from './fixtures/document.base';
import { OpenAPIObject } from './interfaces';
import {
  ApiKeySchemeObject,
  ExternalDocumentationObject,
  HttpSchemeObject,
  OAuth2SchemeObject,
  ParameterObject,
  SecurityRequirementObject,
  SecuritySchemeObject,
  ServerVariableObject,
  TagObject
} from './interfaces/open-api-spec.interface';
import { GlobalParametersStorage } from './storages/global-parameters.storage';

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

  public addExtension(extensionKey: string, extensionProperties: any): this {
    if (!extensionKey.startsWith('x-')) {
      throw new Error(
        'Extension key is not prefixed. Please ensure you prefix it with `x-`.'
      );
    }

    this.document[extensionKey] = clone(extensionProperties);

    return this;
  }

  public addSecurity(name: string, options: SecuritySchemeObject): this {
    this.document.components.securitySchemes = {
      ...(this.document.components.securitySchemes || {}),
      [name]: options
    };
    return this;
  }

  public addGlobalParameters(...parameters: ParameterObject[]): this {
    GlobalParametersStorage.add(...parameters);
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
    name?: string,
    options?: Partial<Optional<HttpSchemeObject, 'type'>>
  ): this;
  /**
   * @deprecated Use `addBearerAuth(name, options)` instead
   */
  public addBearerAuth(
    options?: Partial<Optional<HttpSchemeObject, 'type'>>,
    name?: string
  ): this;
  public addBearerAuth(
    nameOrOptions:
      | string
      | Partial<Optional<HttpSchemeObject, 'type'>> = 'bearer',
    optionsOrName: string | Partial<Optional<HttpSchemeObject, 'type'>> = {}
  ): this {
    if (typeof nameOrOptions === 'object') {
      [nameOrOptions, optionsOrName] = [optionsOrName, nameOrOptions];
    }
    this.addSecurity(nameOrOptions as string, {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      ...(optionsOrName as any)
    });
    return this;
  }

  public addOAuth2(
    name?: string,
    options?: Partial<Optional<OAuth2SchemeObject, 'type'>>
  ): this;
  /**
   * @deprecated Use `addOAuth2(name, options)` instead
   */
  public addOAuth2(
    options?: Partial<Optional<OAuth2SchemeObject, 'type'>>,
    name?: string
  ): this;
  public addOAuth2(
    nameOrOptions:
      | string
      | Partial<Optional<OAuth2SchemeObject, 'type'>> = 'oauth2',
    optionsOrName: string | Partial<Optional<OAuth2SchemeObject, 'type'>> = {}
  ): this {
    if (typeof nameOrOptions === 'object') {
      [nameOrOptions, optionsOrName] = [optionsOrName, nameOrOptions];
    }
    this.addSecurity(nameOrOptions as string, {
      type: 'oauth2',
      flows: {},
      // TODO: avoid using type assertion to 'any' below
      ...(optionsOrName as any)
    });
    return this;
  }

  public addBasicAuth(
    name?: string,
    options?: Partial<Optional<HttpSchemeObject, 'type'>>
  ): this;
  /**
   * @deprecated Use `addBasicAuth(name, options)` instead
   */
  public addBasicAuth(
    options?: Partial<Optional<HttpSchemeObject, 'type'>>,
    name?: string
  ): this;
  public addBasicAuth(
    nameOrOptions:
      | string
      | Partial<Optional<HttpSchemeObject, 'type'>> = 'basic',
    optionsOrName: string | Partial<Optional<HttpSchemeObject, 'type'>> = {}
  ): this {
    if (typeof nameOrOptions === 'object') {
      [nameOrOptions, optionsOrName] = [optionsOrName, nameOrOptions];
    }
    this.addSecurity(nameOrOptions as string, {
      type: 'http',
      scheme: 'basic',
      ...(optionsOrName as any)
    });
    return this;
  }

  public addApiKey(
    name?: string,
    options?: Partial<Optional<ApiKeySchemeObject, 'type'>>
  ): this;
  /**
   * @deprecated Use `addApiKey(name, options)` instead
   */
  public addApiKey(
    options?: Partial<Optional<ApiKeySchemeObject, 'type'>>,
    name?: string
  ): this;
  public addApiKey(
    nameOrOptions:
      | string
      | Partial<Optional<ApiKeySchemeObject, 'type'>> = 'api_key',
    optionsOrName: string | Partial<Optional<ApiKeySchemeObject, 'type'>> = {}
  ): this {
    if (typeof nameOrOptions === 'object') {
      [nameOrOptions, optionsOrName] = [optionsOrName, nameOrOptions];
    }
    this.addSecurity(nameOrOptions as string, {
      type: 'apiKey',
      in: 'header',
      name: nameOrOptions,
      ...(optionsOrName as any)
    });
    return this;
  }

  public addCookieAuth(
    cookieName?: string,
    name?: string,
    options?: Partial<Optional<ApiKeySchemeObject, 'type'>>
  ): this;
  /**
   * @deprecated Use `addCookieAuth(cookieName, name, options)` instead
   */
  public addCookieAuth(
    cookieName: string,
    options?: Partial<Optional<ApiKeySchemeObject, 'type'>>,
    name?: string
  ): this;
  public addCookieAuth(
    cookieName = 'connect.sid',
    nameOrOptions:
      | string
      | Partial<Optional<ApiKeySchemeObject, 'type'>> = 'cookie',
    optionsOrName: string | Partial<Optional<ApiKeySchemeObject, 'type'>> = {}
  ): this {
    if (typeof nameOrOptions === 'object') {
      [nameOrOptions, optionsOrName] = [optionsOrName, nameOrOptions];
    }
    this.addSecurity(nameOrOptions as string, {
      type: 'apiKey',
      in: 'cookie',
      name: cookieName,
      ...(optionsOrName as any)
    });
    return this;
  }

  public build(): Omit<OpenAPIObject, 'paths'> {
    return this.document;
  }
}
