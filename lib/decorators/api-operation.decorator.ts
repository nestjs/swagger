import lodash from 'lodash';
const { isUndefined, negate, pickBy } = lodash;
import { DECORATORS } from '../constants.js';
import { OperationObject } from '../interfaces/open-api-spec.interface.js';
import { createMethodDecorator } from './helpers.js';

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
