import { HttpStatus, Type } from '@nestjs/common';
import { omit } from 'lodash';
import { DECORATORS } from '../constants';
import {
  ReferenceObject,
  ResponseObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface';
import { getTypeIsArrayTuple } from './helpers';

export interface ApiResponseMetadata
  extends Omit<ResponseObject, 'description'> {
  status?: number | 'default' | '1XX' | '2XX' | '3XX' | '4XX' | '5XX';
  type?: Type<unknown> | Function | [Function] | string;
  isArray?: boolean;
  description?: string;
}

export interface ApiResponseSchemaHost
  extends Omit<ResponseObject, 'description'> {
  schema: SchemaObject & Partial<ReferenceObject>;
  status?: number | 'default' | '1XX' | '2XX' | '3XX' | '4XX' | '5XX';
  description?: string;
}

export type ApiResponseOptions = ApiResponseMetadata | ApiResponseSchemaHost;

export function ApiResponse(
  options: ApiResponseOptions,
  { overrideExisting } = { overrideExisting: true }
): MethodDecorator & ClassDecorator {
  const [type, isArray] = getTypeIsArrayTuple(
    (options as ApiResponseMetadata).type,
    (options as ApiResponseMetadata).isArray
  );

  (options as ApiResponseMetadata).type = type;
  (options as ApiResponseMetadata).isArray = isArray;
  options.description = options.description ? options.description : '';

  const groupedMetadata = {
    [options.status || 'default']: omit(options, 'status')
  };
  return (
    target: object,
    key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>
  ): any => {
    if (descriptor) {
      const responses = Reflect.getMetadata(
        DECORATORS.API_RESPONSE,
        descriptor.value
      );

      if (responses && !overrideExisting) {
        return descriptor;
      }
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
    const responses = Reflect.getMetadata(DECORATORS.API_RESPONSE, target);
    if (responses && !overrideExisting) {
      return descriptor;
    }
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
}

export const ApiOkResponse = (options: Omit<ApiResponseOptions, 'status'> = {}) =>
  ApiResponse({
    ...options,
    status: HttpStatus.OK
  });

export const ApiCreatedResponse = (options: Omit<ApiResponseOptions, 'status'> = {}) =>
  ApiResponse({
    ...options,
    status: HttpStatus.CREATED
  });

export const ApiAcceptedResponse = (options: Omit<ApiResponseOptions, 'status'> = {}) =>
  ApiResponse({
    ...options,
    status: HttpStatus.ACCEPTED
  });

export const ApiNoContentResponse = (options: Omit<ApiResponseOptions, 'status'> = {}) =>
  ApiResponse({
    ...options,
    status: HttpStatus.NO_CONTENT
  });

export const ApiMovedPermanentlyResponse = (options: Omit<ApiResponseOptions, 'status'> = {}) =>
  ApiResponse({
    ...options,
    status: HttpStatus.MOVED_PERMANENTLY
  });

export const ApiFoundResponse = (options: Omit<ApiResponseOptions, 'status'> = {}) =>
  ApiResponse({
    ...options,
    status: HttpStatus.FOUND
  });

export const ApiBadRequestResponse = (options: Omit<ApiResponseOptions, 'status'> = {}) =>
  ApiResponse({
    ...options,
    status: HttpStatus.BAD_REQUEST
  });

export const ApiUnauthorizedResponse = (options: Omit<ApiResponseOptions, 'status'> = {}) =>
  ApiResponse({
    ...options,
    status: HttpStatus.UNAUTHORIZED
  });

export const ApiTooManyRequestsResponse = (options: Omit<ApiResponseOptions, 'status'> = {}) =>
  ApiResponse({
    ...options,
    status: HttpStatus.TOO_MANY_REQUESTS
  });

export const ApiNotFoundResponse = (options: Omit<ApiResponseOptions, 'status'> = {}) =>
  ApiResponse({
    ...options,
    status: HttpStatus.NOT_FOUND
  });

export const ApiInternalServerErrorResponse = (
  options: Omit<ApiResponseOptions, 'status'> = {}
) =>
  ApiResponse({
    ...options,
    status: HttpStatus.INTERNAL_SERVER_ERROR
  });

export const ApiBadGatewayResponse = (options: Omit<ApiResponseOptions, 'status'> = {}) =>
  ApiResponse({
    ...options,
    status: HttpStatus.BAD_GATEWAY
  });

export const ApiConflictResponse = (options: Omit<ApiResponseOptions, 'status'> = {}) =>
  ApiResponse({
    ...options,
    status: HttpStatus.CONFLICT
  });

export const ApiForbiddenResponse = (options: Omit<ApiResponseOptions, 'status'> = {}) =>
  ApiResponse({
    ...options,
    status: HttpStatus.FORBIDDEN
  });

export const ApiGatewayTimeoutResponse = (options: Omit<ApiResponseOptions, 'status'> = {}) =>
  ApiResponse({
    ...options,
    status: HttpStatus.GATEWAY_TIMEOUT
  });

export const ApiGoneResponse = (options: Omit<ApiResponseOptions, 'status'> = {}) =>
  ApiResponse({
    ...options,
    status: HttpStatus.GONE
  });

export const ApiMethodNotAllowedResponse = (options: Omit<ApiResponseOptions, 'status'> = {}) =>
  ApiResponse({
    ...options,
    status: HttpStatus.METHOD_NOT_ALLOWED
  });

export const ApiNotAcceptableResponse = (options: Omit<ApiResponseOptions, 'status'> = {}) =>
  ApiResponse({
    ...options,
    status: HttpStatus.NOT_ACCEPTABLE
  });

export const ApiNotImplementedResponse = (options: Omit<ApiResponseOptions, 'status'> = {}) =>
  ApiResponse({
    ...options,
    status: HttpStatus.NOT_IMPLEMENTED
  });

export const ApiPreconditionFailedResponse = (
  options: Omit<ApiResponseOptions, 'status'> = {}
) =>
  ApiResponse({
    ...options,
    status: HttpStatus.PRECONDITION_FAILED
  });

export const ApiPayloadTooLargeResponse = (options: Omit<ApiResponseOptions, 'status'> = {}) =>
  ApiResponse({
    ...options,
    status: HttpStatus.PAYLOAD_TOO_LARGE
  });

export const ApiPaymentRequiredResponse = (options: Omit<ApiResponseOptions, 'status'> = {}) =>
  ApiResponse({
    ...options,
    status: HttpStatus.PAYMENT_REQUIRED
  });

export const ApiRequestTimeoutResponse = (options: Omit<ApiResponseOptions, 'status'> = {}) =>
  ApiResponse({
    ...options,
    status: HttpStatus.REQUEST_TIMEOUT
  });

export const ApiServiceUnavailableResponse = (
  options: Omit<ApiResponseOptions, 'status'> = {}
) =>
  ApiResponse({
    ...options,
    status: HttpStatus.SERVICE_UNAVAILABLE
  });

export const ApiUnprocessableEntityResponse = (
  options: Omit<ApiResponseOptions, 'status'> = {}
) =>
  ApiResponse({
    ...options,
    status: HttpStatus.UNPROCESSABLE_ENTITY
  });

export const ApiUnsupportedMediaTypeResponse = (
  options: Omit<ApiResponseOptions, 'status'> = {}
) =>
  ApiResponse({
    ...options,
    status: HttpStatus.UNSUPPORTED_MEDIA_TYPE
  });

export const ApiDefaultResponse = (options: Omit<ApiResponseOptions, 'status'> = {}) =>
  ApiResponse({
    ...options,
    status: 'default'
  });
