export const appControllerErrorOnlyApiResponseText = `import { Controller, Post, Get } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@Controller('session')
export class AppController {
  @Post('start')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  startSession(): void {}

  @Get('list')
  @ApiForbiddenResponse()
  @ApiBadRequestResponse()
  listSessions(): string {
    return 'ok';
  }

  @Post('refresh')
  @ApiResponse({ status: 500, description: 'Server error' })
  refreshSession(): void {}
}`;

export const appControllerErrorOnlyApiResponseTextTranspiled = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let AppController = class AppController {
    startSession() { }
    listSessions() {
        return 'ok';
    }
    refreshSession() { }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Post)('start'),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Unauthorized' }),
    openapi.ApiResponse({ status: 201 })
], AppController.prototype, "startSession", null);
__decorate([
    (0, common_1.Get)('list'),
    (0, swagger_1.ApiForbiddenResponse)(),
    (0, swagger_1.ApiBadRequestResponse)(),
    openapi.ApiResponse({ status: 200, type: String })
], AppController.prototype, "listSessions", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Server error' }),
    openapi.ApiResponse({ status: 201 })
], AppController.prototype, "refreshSession", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('session')
], AppController);
`;
