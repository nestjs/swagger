import { omit } from 'lodash';
import { DECORATORS } from '../constants';
import { HttpStatus } from '@nestjs/common/enums/http-status.enum';

const initialMetadata = {
  status: 0,
  type: String,
  isArray: false
};

export interface responseMetadata {
  description?: string;
  type?: any;
  isArray?: boolean;
}

export const ApiResponse = (metadata: {
  status: number;
  description?: string;
  headers?: any;
  type?: any;
  isArray?: boolean;
}) => {
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

export const ApiOkResponse = (metadata: responseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.OK
  });

export const ApiCreatedResponse = (metadata: responseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.CREATED
  });

export const ApiBadRequestResponse = (metadata: responseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.BAD_REQUEST
  });

export const ApiInternalServerErrorResponse = (metadata: responseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.INTERNAL_SERVER_ERROR
  });

export const ApiBadGatewayResponse = (metadata: responseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.BAD_GATEWAY
  });

export const ApiConflictResponse = (metadata: responseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.CONFLICT
  });

export const ApiForbiddenResponse = (metadata: responseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.FORBIDDEN
  });

export const ApiGatewayTimeoutResponse = (metadata: responseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.GATEWAY_TIMEOUT
  });

export const ApiGoneResponse = (metadata: responseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.GONE
  });

export const ApiMethodNotAllowedResponse = (metadata: responseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.METHOD_NOT_ALLOWED
  });

export const ApiNotAcceptableResponse = (metadata: responseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.NOT_ACCEPTABLE
  });

export const ApiNotImplementedResponse = (metadata: responseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.NOT_IMPLEMENTED
  });

export const ApiPayloadTooLargeResponse = (metadata: responseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.PAYLOAD_TOO_LARGE
  });

export const ApiRequestTimeoutResponse = (metadata: responseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.REQUEST_TIMEOUT
  });

export const ApiServiceUnavailableResponse = (metadata: responseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.SERVICE_UNAVAILABLE
  });

export const ApiUnprocessableEntityResponse = (metadata: responseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.UNPROCESSABLE_ENTITY
  });

export const ApiUnsupportedMediaTypeResponse = (metadata: responseMetadata) =>
  ApiResponse({
    ...metadata,
    status: HttpStatus.UNSUPPORTED_MEDIA_TYPE
  });
