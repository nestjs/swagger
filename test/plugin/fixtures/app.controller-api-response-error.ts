export const appControllerApiResponseErrorText = `import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

class StartSessionDto {
  token: string;
}

class SessionDto {
  id: string;
}

@Controller('example')
export class AppController {
  @Post('session')
  @ApiUnauthorizedResponse()
  startSession(@Body() body: StartSessionDto): void {
    return;
  }

  @Get('resource/:id')
  @ApiNotFoundResponse({ description: 'Not found' })
  getResource(): string {
    return 'resource';
  }

  @Post('explicit')
  @ApiCreatedResponse({ type: SessionDto })
  @ApiUnauthorizedResponse()
  createExplicit(): SessionDto {
    return { id: '1' };
  }
}`;

export const appControllerApiResponseErrorTextTranspiled = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
class StartSessionDto {
}
class SessionDto {
}
let AppController = class AppController {
    startSession(body) {
        return;
    }
    getResource() {
        return 'resource';
    }
    createExplicit() {
        return { id: '1' };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Post)('session'),
    (0, swagger_1.ApiUnauthorizedResponse)(),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)())
], AppController.prototype, "startSession", null);
__decorate([
    (0, common_1.Get)('resource/:id'),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Not found' }),
    openapi.ApiResponse({ status: 200, type: String })
], AppController.prototype, "getResource", null);
__decorate([
    (0, common_1.Post)('explicit'),
    (0, swagger_1.ApiCreatedResponse)({ type: SessionDto }),
    (0, swagger_1.ApiUnauthorizedResponse)()
], AppController.prototype, "createExplicit", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('example')
], AppController);
`;
