import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { omit } from 'lodash';
import { DECORATORS } from '../constants';
import { getTypeIsArrayTuple } from './helpers';

export interface ResponseMetadata {
  description?: string;
  type?: any;
  isArray?: boolean;
}

export const ApiResponse = (
  metadata: {
    status: number;
    headers?: any;
  } & ResponseMetadata
) => {
  const [type, isArray] = getTypeIsArrayTuple(metadata.type, metadata.isArray);

  metadata.type = type;
  metadata.isArray = isArray;
  metadata.description = metadata.description ? metadata.description : '';

  const groupedMetadata = { [metadata.status]: omit(metadata, 'status') };
  return (target, key?, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      const responses =
        Reflect.getMetadata(DECORATORS.API_RESPONSE, descriptor.value) || {};
      Reflect.defineMetadata(
        DECORATORS.API_RESPONSE,
        {
          ...responses,
          ...groupedMetadata
        },
        descriptor.value
      );
      return descriptor;
    }
    const responses =
      Reflect.getMetadata(DECORATORS.API_RESPONSE, target) || {};
    Reflect.defineMetadata(
      DECORATORS.API_RESPONSE,
      {
        ...responses,
        ...groupedMetadata
      },
      target
    );
    return target;
  };
};

export const ApiOkResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.OK
  });

export const ApiCreatedResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.CREATED
  });

export const ApiAcceptedResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.ACCEPTED
  });

export const ApiNoContentResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.NO_CONTENT
  });

export const ApiMovedPermanentlyResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.MOVED_PERMANENTLY
  });

export const ApiBadRequestResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.BAD_REQUEST
  });

export const ApiUnauthorizedResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.UNAUTHORIZED
  });

export const ApiTooManyRequestsResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.TOO_MANY_REQUESTS
  });

export const ApiNotFoundResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.NOT_FOUND
  });

export const ApiInternalServerErrorResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.INTERNAL_SERVER_ERROR
  });

export const ApiBadGatewayResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.BAD_GATEWAY
  });

export const ApiConflictResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.CONFLICT
  });

export const ApiForbiddenResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.FORBIDDEN
  });

export const ApiGatewayTimeoutResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.GATEWAY_TIMEOUT
  });

export const ApiGoneResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.GONE
  });

export const ApiMethodNotAllowedResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.METHOD_NOT_ALLOWED
  });

export const ApiNotAcceptableResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.NOT_ACCEPTABLE
  });

export const ApiNotImplementedResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.NOT_IMPLEMENTED
  });

export const ApiPayloadTooLargeResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.PAYLOAD_TOO_LARGE
  });

export const ApiRequestTimeoutResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.REQUEST_TIMEOUT
  });

export const ApiServiceUnavailableResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.SERVICE_UNAVAILABLE
  });

export const ApiUnprocessableEntityResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.UNPROCESSABLE_ENTITY
  });

export const ApiUnsupportedMediaTypeResponse = (metadata: ResponseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.UNSUPPORTED_MEDIA_TYPE
  });
