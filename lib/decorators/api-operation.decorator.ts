import { DECORATORS } from '../constants';
import { createMethodDecorator } from './helpers';
import { pickBy, isNil, negate, isUndefined } from 'lodash';

const initialMetadata = {
  summary: ''
};

export interface ApiOperationMetadata {
  title: string;
  description?: string;
  operationId?: string;
  deprecated?: boolean;
}

export const ApiOperation = (
  metadata: ApiOperationMetadata
): MethodDecorator => {
  return createMethodDecorator(
    DECORATORS.API_OPERATION,
    pickBy(
      {
        ...initialMetadata,
        summary: isNil(metadata.title)
          ? initialMetadata.summary
          : metadata.title,
        description: metadata.description,
        operationId: metadata.operationId,
        deprecated: metadata.deprecated
      },
      negate(isUndefined)
    )
  );
};
