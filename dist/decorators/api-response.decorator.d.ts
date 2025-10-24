import { Type } from '@nestjs/common';
import { ReferenceObject, ResponseObject, SchemaObject } from '../interfaces/open-api-spec.interface';
type ApiResponseExampleValue = any;
export interface ApiResponseExamples {
    summary: string;
    value: ApiResponseExampleValue;
}
export interface ApiResponseCommonMetadata extends Omit<ResponseObject, 'description'> {
    status?: number | 'default' | '1XX' | '2XX' | '3XX' | '4XX' | '5XX';
    type?: Type<unknown> | Function | [Function] | string;
    isArray?: boolean;
    description?: string;
}
export type ApiResponseMetadata = (ApiResponseCommonMetadata & {
    example?: ApiResponseExampleValue;
}) | (ApiResponseCommonMetadata & {
    examples?: {
        [key: string]: ApiResponseExamples;
    };
});
export interface ApiResponseSchemaHost extends Omit<ResponseObject, 'description'> {
    schema: SchemaObject & Partial<ReferenceObject>;
    status?: number | 'default' | '1XX' | '2XX' | '3XX' | '4XX' | '5XX';
    description?: string;
}
export type ApiResponseOptions = ApiResponseMetadata | ApiResponseSchemaHost;
export type ApiResponseNoStatusOptions = (Omit<ApiResponseCommonMetadata, 'status'> & {
    example?: ApiResponseExampleValue;
}) | (Omit<ApiResponseCommonMetadata, 'status'> & {
    examples?: {
        [key: string]: ApiResponseExamples;
    };
}) | Omit<ApiResponseSchemaHost, 'status'>;
export declare function ApiResponse(options: ApiResponseOptions, { overrideExisting }?: {
    overrideExisting: boolean;
}): MethodDecorator & ClassDecorator;
export declare const ApiContinueResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiSwitchingProtocolsResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiProcessingResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiEarlyhintsResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiOkResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiCreatedResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiAcceptedResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiNonAuthoritativeInformationResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiNoContentResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiResetContentResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiPartialContentResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiAmbiguousResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiMovedPermanentlyResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiFoundResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiSeeOtherResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiNotModifiedResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiTemporaryRedirectResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiPermanentRedirectResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiBadRequestResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiUnauthorizedResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiPaymentRequiredResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiForbiddenResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiNotFoundResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiMethodNotAllowedResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiNotAcceptableResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiProxyAuthenticationRequiredResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiRequestTimeoutResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiConflictResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiGoneResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiLengthRequiredResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiPreconditionFailedResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiPayloadTooLargeResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiUriTooLongResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiUnsupportedMediaTypeResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiRequestedRangeNotSatisfiableResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiExpectationFailedResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiIAmATeapotResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiMisdirectedResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiUnprocessableEntityResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiFailedDependencyResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiPreconditionRequiredResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiTooManyRequestsResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiInternalServerErrorResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiNotImplementedResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiBadGatewayResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiServiceUnavailableResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiGatewayTimeoutResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator, ApiHttpVersionNotSupportedResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator;
export declare const ApiDefaultResponse: (options?: ApiResponseNoStatusOptions) => MethodDecorator & ClassDecorator;
export {};
