import isUndefined from 'lodash/isUndefined';
import negate from 'lodash/negate';
import pickBy from 'lodash/pickBy';
import { DECORATORS } from '../constants';
import { OperationObject } from '../interfaces/open-api-spec.interface';
import { createMethodDecorator } from './helpers';

export type ApiOperationOptions = Partial<OperationObject>;

const defaultOperationOptions: ApiOperationOptions = {
  summary: ''
};

export function ApiOperation(options: ApiOperationOptions): MethodDecorator {
  return createMethodDecorator(
    DECORATORS.API_OPERATION,
    pickBy(
      {
        ...defaultOperationOptions,
        ...options
      } as ApiOperationOptions,
      negate(isUndefined)
    )
  );
}
