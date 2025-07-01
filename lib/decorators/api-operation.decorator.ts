import { isUndefined, negate, pickBy } from 'es-toolkit/compat';
import { DECORATORS } from '../constants';
import { OperationObject } from '../interfaces/open-api-spec.interface';
import { createMethodDecorator } from './helpers';

export type ApiOperationOptions = Partial<OperationObject>;

const defaultOperationOptions: ApiOperationOptions = {
  summary: ''
};

/**
 * @publicApi
 */
export function ApiOperation(
  options: ApiOperationOptions,
  { overrideExisting } = { overrideExisting: true }
): MethodDecorator {
  return createMethodDecorator(
    DECORATORS.API_OPERATION,
    pickBy(
      {
        ...defaultOperationOptions,
        ...options
      } as ApiOperationOptions,
      negate(isUndefined)
    ),
    { overrideExisting }
  );
}
