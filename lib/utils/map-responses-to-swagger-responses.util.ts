import { mapValues, omit } from 'lodash';
import { isEmpty } from '@nestjs/common/utils/shared.utils';
import { ApiResponseMetadata } from '../decorators';
import { SchemaObject } from '../interfaces/open-api-spec.interface';
import { ResponseObjectFactory } from '../services/response-object-factory';

const responseObjectFactory = new ResponseObjectFactory();
const omitParamType = (param: Record<string, any>) => omit(param, 'type');

export function mapResponsesToSwaggerResponses(
  responses: Record<string, ApiResponseMetadata>,
  schemas: SchemaObject[],
  produces: string[] = ['application/json']
) {
  produces = isEmpty(produces) ? ['application/json'] : produces;

  const openApiResponses = mapValues(
    responses,
    (response: ApiResponseMetadata) =>
      responseObjectFactory.create(response, produces, schemas)
  );
  return mapValues(openApiResponses, omitParamType);
}
