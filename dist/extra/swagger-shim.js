"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiProperty = ApiProperty;
exports.ApiPropertyOptional = ApiPropertyOptional;
exports.ApiResponseProperty = ApiResponseProperty;
exports.ApiBasicAuth = ApiBasicAuth;
exports.ApiBearerAuth = ApiBearerAuth;
exports.ApiBody = ApiBody;
exports.ApiConsumes = ApiConsumes;
exports.ApiCookieAuth = ApiCookieAuth;
exports.ApiExcludeEndpoint = ApiExcludeEndpoint;
exports.ApiIncludeEndpoint = ApiIncludeEndpoint;
exports.ApiExcludeController = ApiExcludeController;
exports.ApiExtraModels = ApiExtraModels;
exports.ApiHeader = ApiHeader;
exports.ApiHeaders = ApiHeaders;
exports.ApiHideProperty = ApiHideProperty;
exports.ApiOAuth2 = ApiOAuth2;
exports.ApiOperation = ApiOperation;
exports.ApiParam = ApiParam;
exports.ApiProduces = ApiProduces;
exports.ApiQuery = ApiQuery;
exports.ApiResponse = ApiResponse;
exports.ApiContinueResponse = ApiContinueResponse;
exports.ApiSwitchingProtocolsResponse = ApiSwitchingProtocolsResponse;
exports.ApiProcessingResponse = ApiProcessingResponse;
exports.ApiEarlyhintsResponse = ApiEarlyhintsResponse;
exports.ApiOkResponse = ApiOkResponse;
exports.ApiCreatedResponse = ApiCreatedResponse;
exports.ApiAcceptedResponse = ApiAcceptedResponse;
exports.ApiNonAuthoritativeInformationResponse = ApiNonAuthoritativeInformationResponse;
exports.ApiNoContentResponse = ApiNoContentResponse;
exports.ApiResetContentResponse = ApiResetContentResponse;
exports.ApiPartialContentResponse = ApiPartialContentResponse;
exports.ApiAmbiguousResponse = ApiAmbiguousResponse;
exports.ApiMovedPermanentlyResponse = ApiMovedPermanentlyResponse;
exports.ApiFoundResponse = ApiFoundResponse;
exports.ApiSeeOtherResponse = ApiSeeOtherResponse;
exports.ApiNotModifiedResponse = ApiNotModifiedResponse;
exports.ApiTemporaryRedirectResponse = ApiTemporaryRedirectResponse;
exports.ApiPermanentRedirectResponse = ApiPermanentRedirectResponse;
exports.ApiBadRequestResponse = ApiBadRequestResponse;
exports.ApiUnauthorizedResponse = ApiUnauthorizedResponse;
exports.ApiPaymentRequiredResponse = ApiPaymentRequiredResponse;
exports.ApiForbiddenResponse = ApiForbiddenResponse;
exports.ApiNotFoundResponse = ApiNotFoundResponse;
exports.ApiMethodNotAllowedResponse = ApiMethodNotAllowedResponse;
exports.ApiNotAcceptableResponse = ApiNotAcceptableResponse;
exports.ApiProxyAuthenticationRequiredResponse = ApiProxyAuthenticationRequiredResponse;
exports.ApiRequestTimeoutResponse = ApiRequestTimeoutResponse;
exports.ApiConflictResponse = ApiConflictResponse;
exports.ApiGoneResponse = ApiGoneResponse;
exports.ApiLengthRequiredResponse = ApiLengthRequiredResponse;
exports.ApiPreconditionFailedResponse = ApiPreconditionFailedResponse;
exports.ApiPayloadTooLargeResponse = ApiPayloadTooLargeResponse;
exports.ApiUriTooLongResponse = ApiUriTooLongResponse;
exports.ApiUnsupportedMediaTypeResponse = ApiUnsupportedMediaTypeResponse;
exports.ApiRequestedRangeNotSatisfiableResponse = ApiRequestedRangeNotSatisfiableResponse;
exports.ApiExpectationFailedResponse = ApiExpectationFailedResponse;
exports.ApiIAmATeapotResponse = ApiIAmATeapotResponse;
exports.ApiMisdirectedResponse = ApiMisdirectedResponse;
exports.ApiUnprocessableEntityResponse = ApiUnprocessableEntityResponse;
exports.ApiFailedDependencyResponse = ApiFailedDependencyResponse;
exports.ApiPreconditionRequiredResponse = ApiPreconditionRequiredResponse;
exports.ApiTooManyRequestsResponse = ApiTooManyRequestsResponse;
exports.ApiInternalServerErrorResponse = ApiInternalServerErrorResponse;
exports.ApiNotImplementedResponse = ApiNotImplementedResponse;
exports.ApiBadGatewayResponse = ApiBadGatewayResponse;
exports.ApiServiceUnavailableResponse = ApiServiceUnavailableResponse;
exports.ApiGatewayTimeoutResponse = ApiGatewayTimeoutResponse;
exports.ApiHttpVersionNotSupportedResponse = ApiHttpVersionNotSupportedResponse;
exports.ApiDefaultResponse = ApiDefaultResponse;
exports.ApiSchema = ApiSchema;
exports.ApiSecurity = ApiSecurity;
exports.ApiTags = ApiTags;
exports.ApiCallbacks = ApiCallbacks;
exports.ApiLink = ApiLink;
exports.ApiDefaultGetter = ApiDefaultGetter;
exports.ApiExtension = ApiExtension;
exports.DocumentBuilder = DocumentBuilder;
exports.SwaggerModule = SwaggerModule;
exports.IntersectionType = IntersectionType;
exports.OmitType = OmitType;
exports.PartialType = PartialType;
exports.PickType = PickType;
exports.getSchemaPath = getSchemaPath;
exports.refs = refs;
exports.before = before;
exports.ReadonlyVisitor = ReadonlyVisitor;
function ApiProperty() {
    return () => { };
}
function ApiPropertyOptional() {
    return () => { };
}
function ApiResponseProperty() {
    return () => { };
}
function ApiBasicAuth() {
    return () => { };
}
function ApiBearerAuth() {
    return () => { };
}
function ApiBody() {
    return () => { };
}
function ApiConsumes() {
    return () => { };
}
function ApiCookieAuth() {
    return () => { };
}
function ApiExcludeEndpoint() {
    return () => { };
}
function ApiIncludeEndpoint() {
    return () => { };
}
function ApiExcludeController() {
    return () => { };
}
function ApiExtraModels() {
    return () => { };
}
function ApiHeader() {
    return () => { };
}
function ApiHeaders() {
    return () => { };
}
function ApiHideProperty() {
    return () => { };
}
function ApiOAuth2() {
    return () => { };
}
function ApiOperation() {
    return () => { };
}
function ApiParam() {
    return () => { };
}
function ApiProduces() {
    return () => { };
}
function ApiQuery() {
    return () => { };
}
function ApiResponse() {
    return () => { };
}
function ApiContinueResponse() {
    return () => { };
}
function ApiSwitchingProtocolsResponse() {
    return () => { };
}
function ApiProcessingResponse() {
    return () => { };
}
function ApiEarlyhintsResponse() {
    return () => { };
}
function ApiOkResponse() {
    return () => { };
}
function ApiCreatedResponse() {
    return () => { };
}
function ApiAcceptedResponse() {
    return () => { };
}
function ApiNonAuthoritativeInformationResponse() {
    return () => { };
}
function ApiNoContentResponse() {
    return () => { };
}
function ApiResetContentResponse() {
    return () => { };
}
function ApiPartialContentResponse() {
    return () => { };
}
function ApiAmbiguousResponse() {
    return () => { };
}
function ApiMovedPermanentlyResponse() {
    return () => { };
}
function ApiFoundResponse() {
    return () => { };
}
function ApiSeeOtherResponse() {
    return () => { };
}
function ApiNotModifiedResponse() {
    return () => { };
}
function ApiTemporaryRedirectResponse() {
    return () => { };
}
function ApiPermanentRedirectResponse() {
    return () => { };
}
function ApiBadRequestResponse() {
    return () => { };
}
function ApiUnauthorizedResponse() {
    return () => { };
}
function ApiPaymentRequiredResponse() {
    return () => { };
}
function ApiForbiddenResponse() {
    return () => { };
}
function ApiNotFoundResponse() {
    return () => { };
}
function ApiMethodNotAllowedResponse() {
    return () => { };
}
function ApiNotAcceptableResponse() {
    return () => { };
}
function ApiProxyAuthenticationRequiredResponse() {
    return () => { };
}
function ApiRequestTimeoutResponse() {
    return () => { };
}
function ApiConflictResponse() {
    return () => { };
}
function ApiGoneResponse() {
    return () => { };
}
function ApiLengthRequiredResponse() {
    return () => { };
}
function ApiPreconditionFailedResponse() {
    return () => { };
}
function ApiPayloadTooLargeResponse() {
    return () => { };
}
function ApiUriTooLongResponse() {
    return () => { };
}
function ApiUnsupportedMediaTypeResponse() {
    return () => { };
}
function ApiRequestedRangeNotSatisfiableResponse() {
    return () => { };
}
function ApiExpectationFailedResponse() {
    return () => { };
}
function ApiIAmATeapotResponse() {
    return () => { };
}
function ApiMisdirectedResponse() {
    return () => { };
}
function ApiUnprocessableEntityResponse() {
    return () => { };
}
function ApiFailedDependencyResponse() {
    return () => { };
}
function ApiPreconditionRequiredResponse() {
    return () => { };
}
function ApiTooManyRequestsResponse() {
    return () => { };
}
function ApiInternalServerErrorResponse() {
    return () => { };
}
function ApiNotImplementedResponse() {
    return () => { };
}
function ApiBadGatewayResponse() {
    return () => { };
}
function ApiServiceUnavailableResponse() {
    return () => { };
}
function ApiGatewayTimeoutResponse() {
    return () => { };
}
function ApiHttpVersionNotSupportedResponse() {
    return () => { };
}
function ApiDefaultResponse() {
    return () => { };
}
function ApiSchema() {
    return () => { };
}
function ApiSecurity() {
    return () => { };
}
function ApiTags() {
    return () => { };
}
function ApiCallbacks() {
    return () => { };
}
function ApiLink() {
    return () => { };
}
function ApiDefaultGetter() {
    return () => { };
}
function ApiExtension() {
    return () => { };
}
function DocumentBuilder() {
    return () => { };
}
function SwaggerModule() {
    return () => { };
}
function IntersectionType() {
    return class {
    };
}
function OmitType() {
    return class {
    };
}
function PartialType() {
    return class {
    };
}
function PickType() {
    return class {
    };
}
function getSchemaPath() {
    return () => '';
}
function refs() {
    return [];
}
function before() {
    return () => '';
}
function ReadonlyVisitor() {
    return class {
    };
}
