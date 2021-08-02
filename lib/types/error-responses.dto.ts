import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { ApiProperty } from "../decorators";

export class BadRequestResponseDto {
  @ApiProperty({
    enum: [HttpStatus.BAD_REQUEST]
  })
  statusCode: number

  @ApiProperty()
  message: string[];

  @ApiProperty({
    enum: ['Bad Request']
  })
  error: string;
}

export class UnauthorizedResponseDto {
  @ApiProperty({
    enum: [HttpStatus.UNAUTHORIZED]
  })
  statusCode: number

  @ApiProperty({
    enum: ['Unauthorized']
  })
  message: string;
}

export class TooManyRequestsResponseDto {
  @ApiProperty({
    enum: [HttpStatus.TOO_MANY_REQUESTS]
  })
  statusCode: number

  @ApiProperty({
    enum: ['Too Many Requests']
  })
  message: string;
}

export class NotFoundResponseDto {
  @ApiProperty({
    enum: [HttpStatus.NOT_FOUND]
  })
  statusCode: number

  @ApiProperty({
    enum: ['Not Found']
  })
  message: string;
}

export class InternalServerErrorResponseDto {
  @ApiProperty({
    enum: [HttpStatus.INTERNAL_SERVER_ERROR]
  })
  statusCode: number

  @ApiProperty({
    enum: ['Internal Server Error']
  })
  message: string;
}

export class BadGatewayResponseDto {
  @ApiProperty({
    enum: [HttpStatus.BAD_GATEWAY]
  })
  statusCode: number

  @ApiProperty({
    enum: ['Bad Gateway']
  })
  message: string;
}

export class ConflictResponseDto {
  @ApiProperty({
    enum: [HttpStatus.CONFLICT]
  })
  statusCode: number

  @ApiProperty({
    enum: ['Conflict']
  })
  message: string;
}

export class ForbiddenResponseDto {
  @ApiProperty({
    enum: [HttpStatus.FORBIDDEN]
  })
  statusCode: number

  @ApiProperty({
    enum: ['Forbidden']
  })
  message: string;
}

export class GatewayTimeoutResponseDto {
  @ApiProperty({
    enum: [HttpStatus.GATEWAY_TIMEOUT]
  })
  statusCode: number

  @ApiProperty({
    enum: ['Gateway Timeout']
  })
  message: string;
}

export class GoneResponseDto {
  @ApiProperty({
    enum: [HttpStatus.GONE]
  })
  statusCode: number

  @ApiProperty({
    enum: ['Gone']
  })
  message: string;
}

export class MethodNotAllowedResponseDto {
  @ApiProperty({
    enum: [HttpStatus.METHOD_NOT_ALLOWED]
  })
  statusCode: number

  @ApiProperty({
    enum: ['Method Not Allowed']
  })
  message: string;
}

export class NotAcceptableResponseDto {
  @ApiProperty({
    enum: [HttpStatus.NOT_ACCEPTABLE]
  })
  statusCode: number

  @ApiProperty({
    enum: ['Not Acceptable']
  })
  message: string;
}

export class NotImplementedResponseDto {
  @ApiProperty({
    enum: [HttpStatus.NOT_IMPLEMENTED]
  })
  statusCode: number

  @ApiProperty({
    enum: ['Not Implemented']
  })
  message: string;
}

export class PreconditionFailedResponseDto {
  @ApiProperty({
    enum: [HttpStatus.PRECONDITION_FAILED]
  })
  statusCode: number

  @ApiProperty({
    enum: ['Precondition Failed']
  })
  message: string;
}

export class PayloadTooLargeResponseDto {
  @ApiProperty({
    enum: [HttpStatus.PAYLOAD_TOO_LARGE]
  })
  statusCode: number

  @ApiProperty({
    enum: ['Payload Too Large']
  })
  message: string;
}

export class RequestTimeoutResponseDto {
  @ApiProperty({
    enum: [HttpStatus.REQUEST_TIMEOUT]
  })
  statusCode: number

  @ApiProperty({
    enum: ['Request Timeout']
  })
  message: string;
}

export class ServiceUnavailableResponseDto {
  @ApiProperty({
    enum: [HttpStatus.SERVICE_UNAVAILABLE]
  })
  statusCode: number

  @ApiProperty({
    enum: ['Service Unavailable']
  })
  message: string;
}

export class UnprocessableEntityResponseDto {
  @ApiProperty({
    enum: [HttpStatus.UNPROCESSABLE_ENTITY]
  })
  statusCode: number

  @ApiProperty({
    enum: ['Unprocessable Entity']
  })
  message: string;
}

export class UnsupportedMediaTypeResponseDto {
  @ApiProperty({
    enum: [HttpStatus.UNSUPPORTED_MEDIA_TYPE]
  })
  statusCode: number

  @ApiProperty({
    enum: ['Unsupported Media Type']
  })
  message: string;
}
