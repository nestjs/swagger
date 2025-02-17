import { HttpStatus, Type } from '@nestjs/common';
import { omit } from 'lodash';
import { DECORATORS } from '../constants';
import {
  ReferenceObject,
  ResponseObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface';
import { getTypeIsArrayTuple } from './helpers';

type ApiResponseExampleValue = any;
export interface ApiResponseExamples {
  summary: string;
  value: ApiResponseExampleValue;
}

export interface ApiResponseCommonMetadata
  extends Omit<ResponseObject, 'description'> {
  status?: number | 'default' | '1XX' | '2XX' | '3XX' | '4XX' | '5XX';
  type?: Type<unknown> | Function | [Function] | string;
  isArray?: boolean;
  description?: string;
}

export type ApiResponseMetadata =
  | (ApiResponseCommonMetadata & { example?: ApiResponseExampleValue })
  | (ApiResponseCommonMetadata & {
      examples?: { [key: string]: ApiResponseExamples };
    });

export interface ApiResponseSchemaHost
  extends Omit<ResponseObject, 'description'> {
  schema: SchemaObject & Partial<ReferenceObject>;
  status?: number | 'default' | '1XX' | '2XX' | '3XX' | '4XX' | '5XX';
  description?: string;
}

export type ApiResponseOptions = ApiResponseMetadata | ApiResponseSchemaHost;

export type ApiResponseNoStatusOptions =
  | (Omit<ApiResponseCommonMetadata, 'status'> & {
      example?: ApiResponseExampleValue;
    })
  | (Omit<ApiResponseCommonMetadata, 'status'> & {
      examples?: { [key: string]: ApiResponseExamples };
    })
  | Omit<ApiResponseSchemaHost, 'status'>;

/**
 * @publicApi
 */
export function ApiResponse(
  options: ApiResponseOptions,
  { overrideExisting } = { overrideExisting: true }
): MethodDecorator & ClassDecorator {
  const apiResponseMetadata = options as ApiResponseMetadata;
  const [type, isArray] = getTypeIsArrayTuple(
    apiResponseMetadata.type,
    apiResponseMetadata.isArray
  );

  apiResponseMetadata.type = type;
  apiResponseMetadata.isArray = isArray;
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
    options?: ApiResponseNoStatusOptions
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
  decorators[functionName] = function (
    options: ApiResponseNoStatusOptions = {}
  ) {
    return ApiResponse({
      ...options,
      status: code
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

export const ApiDefaultResponse = (options: ApiResponseNoStatusOptions = {}) =>
  ApiResponse({
    ...options,
    status: 'default'
  });
