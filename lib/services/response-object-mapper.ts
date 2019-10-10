import { omit } from 'lodash';
import { ApiResponseSchemaHost } from '..';
import { MimetypeContentWrapper } from './mimetype-content-wrapper';
import { ModelPropertiesAccessor } from './model-properties-accessor';
import { SchemaObjectFactory } from './schema-object-factory';
import { SwaggerTypesMapper } from './swagger-types-mapper';

export class ResponseObjectMapper {
  private readonly mimetypeContentWrapper = new MimetypeContentWrapper();
  private readonly modelPropertiesAccessor = new ModelPropertiesAccessor();
  private readonly swaggerTypesMapper = new SwaggerTypesMapper();
  private readonly schemaObjectFactory = new SchemaObjectFactory(
    this.modelPropertiesAccessor,
    this.swaggerTypesMapper
  );

  toArrayRefObject(
    response: Record<string, any>,
    name: string,
    produces: string[]
  ) {
    return {
      ...response,
      ...this.mimetypeContentWrapper.wrap(produces, {
        schema: {
          type: 'array',
          items: {
            $ref: this.schemaObjectFactory.getSchemaPath(name)
          }
        }
      })
    };
  }

  toRefObject(response: Record<string, any>, name: string, produces: string[]) {
    return {
      ...response,
      ...this.mimetypeContentWrapper.wrap(produces, {
        schema: {
          $ref: this.schemaObjectFactory.getSchemaPath(name)
        }
      })
    };
  }

  wrapSchemaWithContent(response: ApiResponseSchemaHost, produces: string[]) {
    if (!response.schema) {
      return response;
    }
    const content = this.mimetypeContentWrapper.wrap(produces, {
      schema: response.schema
    });
    return {
      ...omit(response, 'schema'),
      ...content
    };
  }
}
