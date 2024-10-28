import { Controller, Get, HttpStatus, Param } from '@nestjs/common';
import { DECORATORS } from '../../lib/constants';
import {
  ApiAcceptedResponse,
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiDefaultResponse,
  ApiForbiddenResponse,
  ApiFoundResponse,
  ApiGatewayTimeoutResponse,
  ApiGoneResponse,
  ApiInternalServerErrorResponse,
  ApiMethodNotAllowedResponse,
  ApiMovedPermanentlyResponse,
  ApiNoContentResponse,
  ApiNotAcceptableResponse,
  ApiNotFoundResponse,
  ApiNotImplementedResponse,
  ApiOkResponse,
  ApiPayloadTooLargeResponse,
  ApiPaymentRequiredResponse,
  ApiPreconditionFailedResponse,
  ApiRequestTimeoutResponse,
  ApiResponse,
  ApiServiceUnavailableResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiUnsupportedMediaTypeResponse
} from '../../lib/decorators';

describe('ApiResponse', () => {
  describe('when applied on the method level', () => {
    @Controller('tests/:testId')
    class TestAppController {
      @Get()
      @ApiResponse({ status: 204 })
      public get(@Param('testId') testId: string): string {
        return testId;
      }
    }

    it('should attach metadata to a given method', () => {
      const controller = new TestAppController();
      expect(
        Reflect.hasMetadata(DECORATORS.API_RESPONSE, controller.get)
      ).toBeTruthy();
      expect(
        Reflect.getMetadata(DECORATORS.API_RESPONSE, controller.get)
      ).toEqual({
        '204': { description: '', isArray: undefined, type: undefined }
      });
    });

    it.each([
      { decorator: ApiOkResponse, status: HttpStatus.OK },
      { decorator: ApiCreatedResponse, status: HttpStatus.CREATED },
      { decorator: ApiAcceptedResponse, status: HttpStatus.ACCEPTED },
      { decorator: ApiNoContentResponse, status: HttpStatus.NO_CONTENT },
      {
        decorator: ApiMovedPermanentlyResponse,
        status: HttpStatus.MOVED_PERMANENTLY
      },
      { decorator: ApiFoundResponse, status: HttpStatus.FOUND },
      { decorator: ApiBadRequestResponse, status: HttpStatus.BAD_REQUEST },
      { decorator: ApiUnauthorizedResponse, status: HttpStatus.UNAUTHORIZED },
      {
        decorator: ApiTooManyRequestsResponse,
        status: HttpStatus.TOO_MANY_REQUESTS
      },
      { decorator: ApiNotFoundResponse, status: HttpStatus.NOT_FOUND },
      {
        decorator: ApiInternalServerErrorResponse,
        status: HttpStatus.INTERNAL_SERVER_ERROR
      },
      { decorator: ApiBadGatewayResponse, status: HttpStatus.BAD_GATEWAY },
      { decorator: ApiConflictResponse, status: HttpStatus.CONFLICT },
      { decorator: ApiForbiddenResponse, status: HttpStatus.FORBIDDEN },
      {
        decorator: ApiGatewayTimeoutResponse,
        status: HttpStatus.GATEWAY_TIMEOUT
      },
      { decorator: ApiGoneResponse, status: HttpStatus.GONE },
      {
        decorator: ApiMethodNotAllowedResponse,
        status: HttpStatus.METHOD_NOT_ALLOWED
      },
      {
        decorator: ApiNotAcceptableResponse,
        status: HttpStatus.NOT_ACCEPTABLE
      },
      {
        decorator: ApiNotImplementedResponse,
        status: HttpStatus.NOT_IMPLEMENTED
      },
      {
        decorator: ApiPreconditionFailedResponse,
        status: HttpStatus.PRECONDITION_FAILED
      },
      {
        decorator: ApiPayloadTooLargeResponse,
        status: HttpStatus.PAYLOAD_TOO_LARGE
      },
      {
        decorator: ApiPaymentRequiredResponse,
        status: HttpStatus.PAYMENT_REQUIRED
      },
      {
        decorator: ApiRequestTimeoutResponse,
        status: HttpStatus.REQUEST_TIMEOUT
      },
      {
        decorator: ApiServiceUnavailableResponse,
        status: HttpStatus.SERVICE_UNAVAILABLE
      },
      {
        decorator: ApiUnprocessableEntityResponse,
        status: HttpStatus.UNPROCESSABLE_ENTITY
      },
      {
        decorator: ApiUnsupportedMediaTypeResponse,
        status: HttpStatus.UNSUPPORTED_MEDIA_TYPE
      },
      { decorator: ApiDefaultResponse, status: 'default' }
    ] as const)(
      'should not allow to override status of $decorator.name[$status]',
      ({ decorator, status }) => {
        @Controller('tests/:testId')
        class TestAppController {
          @Get()
          @decorator({
            // @ts-expect-error -- Should error if user tries to override status
            status: 2010
          })
          public get(@Param('testId') testId: string): string {
            return testId;
          }
        }

        const controller = new TestAppController();
        expect(
          Reflect.hasMetadata(DECORATORS.API_RESPONSE, controller.get)
        ).toBeTruthy();
        expect(
          Reflect.getMetadata(DECORATORS.API_RESPONSE, controller.get)
        ).toEqual({
          [status]: { description: '', isArray: undefined, type: undefined }
        });
      }
    );
  });
});
