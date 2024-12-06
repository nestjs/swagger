import { Logger } from '@nestjs/common';
import { clone, isString, isUndefined, negate, pickBy } from 'lodash';
import { buildDocumentBase } from './fixtures/document.base';
import { OpenAPIObject } from './interfaces';
import {
  ApiKeySchemeObject,
  HttpSchemeObject,
  OAuth2SchemeObject,
  SecuritySchemeObject as SSObject,
  ExternalDocumentationObject,
  ParameterObject,
  SecurityRequirementObject,
  ServerVariableObject,
  TagObject
} from './interfaces/open-api-spec.interface';
import { GlobalParametersStorage } from './storages/global-parameters.storage';

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

type OptSObject<T extends Partial<SSObject>> = Partial<Optional<T, 'type'>>;

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

  public setOpenAPIVersion(version: string): this {
    if (version.match(/^\d\.\d\.\d$/)) {
      this.document.openapi = version;
    } else {
      this.logger.warn(
        'The OpenApi version is invalid. Expecting format "x.x.x"'
      );
    }
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

  public addSecurity(name: string, options: SSObject): this {
    this.document.components.securitySchemes = {
      ...(this.document.components.securitySchemes || {}),
      [name]: options
    };
    return this;
  }

  public addGlobalParameters(
    // Examples should be specified under the "schema" object
    // Top level attributes are ignored
    ...parameters: Omit<ParameterObject, 'example' | 'examples'>[]
  ): this {
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

  public addBearerAuth<SO extends SSObject = HttpSchemeObject>(
    name?: string,
    options?: OptSObject<SO>
  ): this;
  /**
   * @deprecated Use `addBearerAuth(name, options)` instead
   */
  public addBearerAuth<SO extends SSObject = HttpSchemeObject>(
    options?: OptSObject<SO>,
    name?: string
  ): this;
  public addBearerAuth<SO extends SSObject = HttpSchemeObject>(
    nameOrOptions: string | OptSObject<SO> = 'bearer',
    optionsOrName: string | OptSObject<SO> = {}
  ): this {
    if (typeof nameOrOptions === 'object') {
      [nameOrOptions, optionsOrName] = [optionsOrName, nameOrOptions];
    }
    this.addSecurity(nameOrOptions as string, {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      ...(optionsOrName as OptSObject<SO>)
    });
    return this;
  }

  public addOAuth2<SO extends SSObject = OAuth2SchemeObject>(
    name?: string,
    options?: OptSObject<SO>
  ): this;
  /**
   * @deprecated Use `addOAuth2(name, options)` instead
   */
  public addOAuth2<SO extends SSObject = OAuth2SchemeObject>(
    options?: OptSObject<SO>,
    name?: string
  ): this;
  public addOAuth2<SO extends SSObject = OAuth2SchemeObject>(
    nameOrOptions: string | OptSObject<SO> = 'oauth2',
    optionsOrName: string | OptSObject<SO> = {}
  ): this {
    if (typeof nameOrOptions === 'object') {
      [nameOrOptions, optionsOrName] = [optionsOrName, nameOrOptions];
    }
    this.addSecurity(nameOrOptions as string, {
      type: 'oauth2',
      flows: {},
      ...(optionsOrName as OptSObject<SO>)
    });
    return this;
  }

  public addBasicAuth<SO extends SSObject = HttpSchemeObject>(
    name?: string,
    options?: OptSObject<SO>
  ): this;
  /**
   * @deprecated Use `addBasicAuth(name, options)` instead
   */
  public addBasicAuth<SO extends SSObject = HttpSchemeObject>(
    options?: OptSObject<SO>,
    name?: string
  ): this;
  public addBasicAuth<SO extends SSObject = HttpSchemeObject>(
    nameOrOptions: string | OptSObject<SO> = 'basic',
    optionsOrName: string | OptSObject<SO> = {}
  ): this {
    if (typeof nameOrOptions === 'object') {
      [nameOrOptions, optionsOrName] = [optionsOrName, nameOrOptions];
    }
    this.addSecurity(nameOrOptions as string, {
      type: 'http',
      scheme: 'basic',
      ...(optionsOrName as OptSObject<SO>)
    });
    return this;
  }

  public addApiKey<SO extends SSObject = ApiKeySchemeObject>(
    name?: string,
    options?: OptSObject<SO>
  ): this;
  /**
   * @deprecated Use `addApiKey(name, options)` instead
   */
  public addApiKey<SO extends SSObject = ApiKeySchemeObject>(
    options?: OptSObject<SO>,
    name?: string
  ): this;
  public addApiKey<SO extends SSObject = ApiKeySchemeObject>(
    nameOrOptions: string | OptSObject<SO> = 'api_key',
    optionsOrName: string | OptSObject<SO> = {}
  ): this {
    if (typeof nameOrOptions === 'object') {
      [nameOrOptions, optionsOrName] = [optionsOrName, nameOrOptions];
    }
    this.addSecurity(nameOrOptions as string, {
      type: 'apiKey',
      in: 'header',
      name: nameOrOptions as string,
      ...(optionsOrName as OptSObject<SO>)
    });
    return this;
  }

  public addCookieAuth<SO extends SSObject = ApiKeySchemeObject>(
    cookieName?: string,
    name?: string,
    options?: OptSObject<ApiKeySchemeObject>
  ): this;
  /**
   * @deprecated Use `addCookieAuth(cookieName, name, options)` instead
   */
  public addCookieAuth<SO extends SSObject = ApiKeySchemeObject>(
    cookieName: string,
    options?: OptSObject<ApiKeySchemeObject>,
    name?: string
  ): this;
  public addCookieAuth<SO extends SSObject = ApiKeySchemeObject>(
    cookieName = 'connect.sid',
    nameOrOptions: string | OptSObject<ApiKeySchemeObject> = 'cookie',
    optionsOrName: string | OptSObject<ApiKeySchemeObject> = {}
  ): this {
    if (typeof nameOrOptions === 'object') {
      [nameOrOptions, optionsOrName] = [optionsOrName, nameOrOptions];
    }
    this.addSecurity(nameOrOptions as string, {
      type: 'apiKey',
      in: 'cookie',
      name: cookieName,
      ...(optionsOrName as OptSObject<SO>)
    });
    return this;
  }

  public build(): Omit<OpenAPIObject, 'paths'> {
    return this.document;
  }
}
