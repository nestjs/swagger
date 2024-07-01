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
  example?: any;
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

interface HttpStatusInfo {
  code: number;
  functionName: string;
}

const decorators: {
  [key: string]: (
    options?: ApiResponseOptions
  ) => MethodDecorator & ClassDecorator;
} = {};

const statusList: HttpStatusInfo[] = Object.keys(HttpStatus)
  .filter((key) => !isNaN(Number(HttpStatus[key])))
  .map((key) => {
    const functionName = key
      .split('_')
      .map(
        (strToken) =>
          `${strToken[0].toUpperCase()}${strToken.slice(1).toLowerCase()}`
      )
      .join('');
    return {
      code: Number(HttpStatus[key]),
      functionName: `Api${functionName}Response`
    };
  });

statusList.forEach(({ code, functionName }) => {
  decorators[functionName] = function (options: ApiResponseOptions = {}) {
    return ApiResponse({
      ...options,
      status: code // Convert status to number
    });
  };
});

export const {
  ApiContinueResponse,
  ApiSwitchingProtocolsResponse,
  ApiProcessingResponse,
  ApiEarlyhintsResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiAcceptedResponse,
  ApiNonAuthoritativeInformationResponse,
  ApiNoContentResponse,
  ApiResetContentResponse,
  ApiPartialContentResponse,
  ApiAmbiguousResponse,
  ApiMovedPermanentlyResponse,
  ApiFoundResponse,
  ApiSeeOtherResponse,
  ApiNotModifiedResponse,
  ApiTemporaryRedirectResponse,
  ApiPermanentRedirectResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiPaymentRequiredResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiMethodNotAllowedResponse,
  ApiNotAcceptableResponse,
  ApiProxyAuthenticationRequiredResponse,
  ApiRequestTimeoutResponse,
  ApiConflictResponse,
  ApiGoneResponse,
  ApiLengthRequiredResponse,
  ApiPreconditionFailedResponse,
  ApiPayloadTooLargeResponse,
  ApiUriTooLongResponse,
  ApiUnsupportedMediaTypeResponse,
  ApiRequestedRangeNotSatisfiableResponse,
  ApiExpectationFailedResponse,
  ApiIAmATeapotResponse,
  ApiMisdirectedResponse,
  ApiUnprocessableEntityResponse,
  ApiFailedDependencyResponse,
  ApiPreconditionRequiredResponse,
  ApiTooManyRequestsResponse,
  ApiInternalServerErrorResponse,
  ApiNotImplementedResponse,
  ApiBadGatewayResponse,
  ApiServiceUnavailableResponse,
  ApiGatewayTimeoutResponse,
  ApiHttpVersionNotSupportedResponse
} = decorators;

export const ApiDefaultResponse = (options: ApiResponseOptions = {}) =>
  ApiResponse({
    ...options,
    status: 'default'
  });
