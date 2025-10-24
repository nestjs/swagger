"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiDefaultResponse = exports.ApiHttpVersionNotSupportedResponse = exports.ApiGatewayTimeoutResponse = exports.ApiServiceUnavailableResponse = exports.ApiBadGatewayResponse = exports.ApiNotImplementedResponse = exports.ApiInternalServerErrorResponse = exports.ApiTooManyRequestsResponse = exports.ApiPreconditionRequiredResponse = exports.ApiFailedDependencyResponse = exports.ApiUnprocessableEntityResponse = exports.ApiMisdirectedResponse = exports.ApiIAmATeapotResponse = exports.ApiExpectationFailedResponse = exports.ApiRequestedRangeNotSatisfiableResponse = exports.ApiUnsupportedMediaTypeResponse = exports.ApiUriTooLongResponse = exports.ApiPayloadTooLargeResponse = exports.ApiPreconditionFailedResponse = exports.ApiLengthRequiredResponse = exports.ApiGoneResponse = exports.ApiConflictResponse = exports.ApiRequestTimeoutResponse = exports.ApiProxyAuthenticationRequiredResponse = exports.ApiNotAcceptableResponse = exports.ApiMethodNotAllowedResponse = exports.ApiNotFoundResponse = exports.ApiForbiddenResponse = exports.ApiPaymentRequiredResponse = exports.ApiUnauthorizedResponse = exports.ApiBadRequestResponse = exports.ApiPermanentRedirectResponse = exports.ApiTemporaryRedirectResponse = exports.ApiNotModifiedResponse = exports.ApiSeeOtherResponse = exports.ApiFoundResponse = exports.ApiMovedPermanentlyResponse = exports.ApiAmbiguousResponse = exports.ApiPartialContentResponse = exports.ApiResetContentResponse = exports.ApiNoContentResponse = exports.ApiNonAuthoritativeInformationResponse = exports.ApiAcceptedResponse = exports.ApiCreatedResponse = exports.ApiOkResponse = exports.ApiEarlyhintsResponse = exports.ApiProcessingResponse = exports.ApiSwitchingProtocolsResponse = exports.ApiContinueResponse = void 0;
exports.ApiResponse = ApiResponse;
const common_1 = require("@nestjs/common");
const lodash_1 = require("lodash");
const constants_1 = require("../constants");
const helpers_1 = require("./helpers");
function ApiResponse(options, { overrideExisting } = { overrideExisting: true }) {
    const apiResponseMetadata = options;
    const [type, isArray] = (0, helpers_1.getTypeIsArrayTuple)(apiResponseMetadata.type, apiResponseMetadata.isArray);
    apiResponseMetadata.type = type;
    apiResponseMetadata.isArray = isArray;
    options.description = options.description ? options.description : '';
    const groupedMetadata = {
        [options.status || 'default']: (0, lodash_1.omit)(options, 'status')
    };
    return (target, key, descriptor) => {
        if (descriptor) {
            const responses = Reflect.getMetadata(constants_1.DECORATORS.API_RESPONSE, descriptor.value);
            if (responses && !overrideExisting) {
                return descriptor;
            }
            Reflect.defineMetadata(constants_1.DECORATORS.API_RESPONSE, Object.assign(Object.assign({}, responses), groupedMetadata), descriptor.value);
            return descriptor;
        }
        const responses = Reflect.getMetadata(constants_1.DECORATORS.API_RESPONSE, target);
        if (responses && !overrideExisting) {
            return descriptor;
        }
        Reflect.defineMetadata(constants_1.DECORATORS.API_RESPONSE, Object.assign(Object.assign({}, responses), groupedMetadata), target);
        return target;
    };
}
const decorators = {};
const statusList = Object.keys(common_1.HttpStatus)
    .filter((key) => !isNaN(Number(common_1.HttpStatus[key])))
    .map((key) => {
    const functionName = key
        .split('_')
        .map((strToken) => `${strToken[0].toUpperCase()}${strToken.slice(1).toLowerCase()}`)
        .join('');
    return {
        code: Number(common_1.HttpStatus[key]),
        functionName: `Api${functionName}Response`
    };
});
statusList.forEach(({ code, functionName }) => {
    decorators[functionName] = function (options = {}) {
        return ApiResponse(Object.assign(Object.assign({}, options), { status: code }));
    };
});
exports.ApiContinueResponse = decorators.ApiContinueResponse, exports.ApiSwitchingProtocolsResponse = decorators.ApiSwitchingProtocolsResponse, exports.ApiProcessingResponse = decorators.ApiProcessingResponse, exports.ApiEarlyhintsResponse = decorators.ApiEarlyhintsResponse, exports.ApiOkResponse = decorators.ApiOkResponse, exports.ApiCreatedResponse = decorators.ApiCreatedResponse, exports.ApiAcceptedResponse = decorators.ApiAcceptedResponse, exports.ApiNonAuthoritativeInformationResponse = decorators.ApiNonAuthoritativeInformationResponse, exports.ApiNoContentResponse = decorators.ApiNoContentResponse, exports.ApiResetContentResponse = decorators.ApiResetContentResponse, exports.ApiPartialContentResponse = decorators.ApiPartialContentResponse, exports.ApiAmbiguousResponse = decorators.ApiAmbiguousResponse, exports.ApiMovedPermanentlyResponse = decorators.ApiMovedPermanentlyResponse, exports.ApiFoundResponse = decorators.ApiFoundResponse, exports.ApiSeeOtherResponse = decorators.ApiSeeOtherResponse, exports.ApiNotModifiedResponse = decorators.ApiNotModifiedResponse, exports.ApiTemporaryRedirectResponse = decorators.ApiTemporaryRedirectResponse, exports.ApiPermanentRedirectResponse = decorators.ApiPermanentRedirectResponse, exports.ApiBadRequestResponse = decorators.ApiBadRequestResponse, exports.ApiUnauthorizedResponse = decorators.ApiUnauthorizedResponse, exports.ApiPaymentRequiredResponse = decorators.ApiPaymentRequiredResponse, exports.ApiForbiddenResponse = decorators.ApiForbiddenResponse, exports.ApiNotFoundResponse = decorators.ApiNotFoundResponse, exports.ApiMethodNotAllowedResponse = decorators.ApiMethodNotAllowedResponse, exports.ApiNotAcceptableResponse = decorators.ApiNotAcceptableResponse, exports.ApiProxyAuthenticationRequiredResponse = decorators.ApiProxyAuthenticationRequiredResponse, exports.ApiRequestTimeoutResponse = decorators.ApiRequestTimeoutResponse, exports.ApiConflictResponse = decorators.ApiConflictResponse, exports.ApiGoneResponse = decorators.ApiGoneResponse, exports.ApiLengthRequiredResponse = decorators.ApiLengthRequiredResponse, exports.ApiPreconditionFailedResponse = decorators.ApiPreconditionFailedResponse, exports.ApiPayloadTooLargeResponse = decorators.ApiPayloadTooLargeResponse, exports.ApiUriTooLongResponse = decorators.ApiUriTooLongResponse, exports.ApiUnsupportedMediaTypeResponse = decorators.ApiUnsupportedMediaTypeResponse, exports.ApiRequestedRangeNotSatisfiableResponse = decorators.ApiRequestedRangeNotSatisfiableResponse, exports.ApiExpectationFailedResponse = decorators.ApiExpectationFailedResponse, exports.ApiIAmATeapotResponse = decorators.ApiIAmATeapotResponse, exports.ApiMisdirectedResponse = decorators.ApiMisdirectedResponse, exports.ApiUnprocessableEntityResponse = decorators.ApiUnprocessableEntityResponse, exports.ApiFailedDependencyResponse = decorators.ApiFailedDependencyResponse, exports.ApiPreconditionRequiredResponse = decorators.ApiPreconditionRequiredResponse, exports.ApiTooManyRequestsResponse = decorators.ApiTooManyRequestsResponse, exports.ApiInternalServerErrorResponse = decorators.ApiInternalServerErrorResponse, exports.ApiNotImplementedResponse = decorators.ApiNotImplementedResponse, exports.ApiBadGatewayResponse = decorators.ApiBadGatewayResponse, exports.ApiServiceUnavailableResponse = decorators.ApiServiceUnavailableResponse, exports.ApiGatewayTimeoutResponse = decorators.ApiGatewayTimeoutResponse, exports.ApiHttpVersionNotSupportedResponse = decorators.ApiHttpVersionNotSupportedResponse;
const ApiDefaultResponse = (options = {}) => ApiResponse(Object.assign(Object.assign({}, options), { status: 'default' }));
exports.ApiDefaultResponse = ApiDefaultResponse;
