import { isFunction, omit } from 'lodash';
import { ApiResponseMetadata, ApiResponseSchemaHost } from '../decorators';
import { SchemaObject } from '../interfaces/open-api-spec.interface';
import { isBuiltInType } from '../utils/is-built-in-type.util';
import { MimetypeContentWrapper } from './mimetype-content-wrapper';
import { ModelPropertiesAccessor } from './model-properties-accessor';
import { ResponseObjectMapper } from './response-object-mapper';
import { SchemaObjectFactory } from './schema-object-factory';
import { SwaggerTypesMapper } from './swagger-types-mapper';

export class ResponseObjectFactory {
  private readonly mimetypeContentWrapper = new MimetypeContentWrapper();
  private readonly modelPropertiesAccessor = new ModelPropertiesAccessor();
  private readonly swaggerTypesMapper = new SwaggerTypesMapper();
  private readonly schemaObjectFactory = new SchemaObjectFactory(
    this.modelPropertiesAccessor,
    this.swaggerTypesMapper
  );
  private readonly responseObjectMapper = new ResponseObjectMapper();

  create(
    response: ApiResponseMetadata,
    produces: string[],
    schemas: Record<string, SchemaObject>
  ) {
    const { type, isArray } = response as ApiResponseMetadata;
    response = omit(response, ['isArray']);
    if (!type) {
      return this.responseObjectMapper.wrapSchemaWithContent(
        response as ApiResponseSchemaHost,
        produces
      );
    }
    if (isBuiltInType(type as Function)) {
      const typeName =
        type && isFunction(type) ? (type as Function).name : (type as string);
      const swaggerType = this.swaggerTypesMapper.mapTypeToOpenAPIType(
        typeName
      );

      if (isArray) {
        const content = this.mimetypeContentWrapper.wrap(produces, {
          schema: {
            type: 'array',
            items: {
              type: swaggerType
            }
          }
        });
        return {
          ...response,
          ...content
        };
      }
      const content = this.mimetypeContentWrapper.wrap(produces, {
        schema: {
          type: swaggerType
        }
      });
      return {
        ...response,
        ...content
      };
    }
    const name = this.schemaObjectFactory.exploreModelSchema(
      type as Function,
      schemas
    );
    if (isArray) {
      return this.responseObjectMapper.toArrayRefObject(
        response,
        name,
        produces
      );
    }
    return this.responseObjectMapper.toRefObject(response, name, produces);
  }
}
