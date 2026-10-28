import isEmpty from 'es-toolkit/compat/isEmpty';
import isFunction from 'es-toolkit/compat/isFunction';
import omit from 'es-toolkit/compat/omit';
import pick from 'es-toolkit/compat/pick';
import { DECORATORS } from '../constants.js';
import {
  ApiPropertyOptions,
  ApiResponseMetadata,
  ApiResponseSchemaHost
} from '../decorators/index.js';
import {
  LinksObject,
  ReferenceObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface.js';
import { StandardSchemaConverter } from '../interfaces/swagger-document-options.interface.js';
import { isBuiltInType } from '../utils/is-built-in-type.util.js';
import { isDateCtor } from '../utils/is-date-ctor.util.js';
import { MimetypeContentWrapper } from './mimetype-content-wrapper.js';
import { ModelPropertiesAccessor } from './model-properties-accessor.js';
import { ResponseObjectMapper } from './response-object-mapper.js';
import { SchemaObjectFactory } from './schema-object-factory.js';
import { StandardSchemaOpenApiConverter } from './standard-schema-openapi.converter.js';
import { SwaggerTypesMapper } from './swagger-types-mapper.js';

export type FactoriesNeededByResponseFactory = {
  linkName: (
    controllerKey: string,
    methodKey: string,
    fieldKey: string
  ) => string;
  operationId: (controllerKey: string, methodKey: string) => string;
};

export class ResponseObjectFactory {
  private readonly mimetypeContentWrapper = new MimetypeContentWrapper();
  private readonly modelPropertiesAccessor = new ModelPropertiesAccessor();
  private readonly swaggerTypesMapper = new SwaggerTypesMapper();
  private readonly standardSchemaOpenApiConverter =
    new StandardSchemaOpenApiConverter(this.standardSchemaConverter);
  private readonly schemaObjectFactory = new SchemaObjectFactory(
    this.modelPropertiesAccessor,
    this.swaggerTypesMapper,
    this.standardSchemaConverter
  );
  private readonly responseObjectMapper = new ResponseObjectMapper();

  constructor(
    private readonly standardSchemaConverter?: StandardSchemaConverter
  ) {}

  create(
    response: ApiResponseMetadata,
    produces: string[],
    schemas: Record<string, SchemaObject>,
    factories: FactoriesNeededByResponseFactory
  ) {
    const { type, isArray } = response;
    const schemaOverride = this.getSchemaOverride(response, schemas);
    response = omit(response, ['isArray', 'standardSchema']);

    if (schemaOverride) {
      return this.responseObjectMapper.wrapSchemaWithContent(
        {
          ...omit(response, ['type']),
          schema: isArray
            ? { type: 'array', items: schemaOverride }
            : schemaOverride
        } as ApiResponseSchemaHost & ApiResponseMetadata,
        produces,
        schemas
      );
    }

    if (!type) {
      return this.responseObjectMapper.wrapSchemaWithContent(
        response as ApiResponseSchemaHost,
        produces,
        schemas
      );
    }

    if (
      isBuiltInType(type as Function) ||
      isDateCtor(type as Function) ||
      type === BigInt
    ) {
      const itemSchema = this.getBuiltInTypeSchema(type as Function | string);

      const exampleKeys = ['example', 'examples'];
      const baseSchema: SchemaObject = isArray
        ? { type: 'array', items: itemSchema }
        : itemSchema;
      // Mirror the nullable handling in ResponseObjectMapper so the
      // "nullable" flag does not leak into the response object root. 3.1
      // documents get it rewritten into a union by convertNullableToOas31.
      const schema: SchemaObject = response.nullable
        ? { ...baseSchema, nullable: true }
        : baseSchema;
      const content = this.mimetypeContentWrapper.wrap(produces, {
        schema,
        ...pick(response, exampleKeys)
      });
      return {
        ...omit(response, [...exampleKeys, 'nullable']),
        ...content
      };
    }
    const name = this.schemaObjectFactory.exploreModelSchema(
      type as Function,
      schemas
    );
    if (isFunction(type) && type.prototype) {
      const { prototype } = type;
      const links: LinksObject = {};

      const properties =
        this.modelPropertiesAccessor.getModelProperties(prototype);

      const generateLink = (
        controllerPrototype: { constructor: { name: string } },
        method: Function,
        parameter: string,
        field: string
      ) => {
        if (!factories) {
          return;
        }
        const linkName = factories.linkName(
          controllerPrototype.constructor.name,
          method.name,
          field
        );

        links[linkName] = {
          operationId: factories.operationId(
            controllerPrototype.constructor.name,
            method.name
          ),
          parameters: {
            [parameter]: `$response.body#/${field}`
          }
        };
      };

      // links defined by @ApiProperty({link: () => type}) and @ApiDefaultGetter
      for (const key of properties) {
        const metadata: ApiPropertyOptions =
          Reflect.getMetadata(
            DECORATORS.API_MODEL_PROPERTIES,
            prototype,
            key
          ) ?? {};

        if (!metadata.link) {
          continue;
        }

        const linkedType = metadata.link();

        const linkedGetterInfo = Reflect.getMetadata(
          DECORATORS.API_DEFAULT_GETTER,
          linkedType.prototype
        );

        if (!linkedGetterInfo) {
          continue;
        }

        const {
          getter,
          parameter,
          prototype: controllerPrototype
        } = linkedGetterInfo;

        generateLink(controllerPrototype, getter, parameter, key);
      }

      // links defind by @ApiLink
      const customLinks = Reflect.getMetadata(DECORATORS.API_LINK, prototype);

      for (const customLink of customLinks ?? []) {
        const {
          method,
          parameter,
          field,
          prototype: controllerPrototype
        } = customLink;

        generateLink(controllerPrototype, method, parameter, field);
      }

      if (!isEmpty(links)) {
        // merge links into the response links provided by the user - the provided links
        // prevail against the new ones in case of conflict
        response.links = Object.assign(links, response.links);
      }
    }
    if (isArray) {
      return this.responseObjectMapper.toArrayRefObject(
        response,
        name,
        produces
      );
    }
    return this.responseObjectMapper.toRefObject(response, name, produces);
  }

  private getBuiltInTypeSchema(type: Function | string): SchemaObject {
    if (isDateCtor(type)) {
      return { type: 'string', format: 'date-time' };
    }
    if (type === BigInt) {
      return { type: 'integer', format: 'int64' };
    }
    const typeName = isFunction(type) ? type.name : type;
    return { type: this.swaggerTypesMapper.mapTypeToOpenAPIType(typeName) };
  }

  private getSchemaOverride(
    response: ApiResponseMetadata,
    schemas: Record<string, SchemaObject>
  ): SchemaObject | ReferenceObject | undefined {
    return this.standardSchemaOpenApiConverter.convertInto(
      response.standardSchema,
      schemas,
      'output'
    );
  }
}
