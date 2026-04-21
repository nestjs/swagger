export const appControllerApiResponseErrorText = `import { Body, Controller, Get, Post, Redirect } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiFoundResponse,
  ApiNotFoundResponse,
  ApiResponse,
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

  @Post('refresh')
  @ApiResponse({ status: 500, description: 'Server error' })
  refreshSession(): void {
    return;
  }

  @Get('redirect')
  @Redirect()
  @ApiFoundResponse({ description: 'Redirects to a URL' })
  getRedirect(): { url: string; statusCode: number } {
    return { url: 'https://example.com', statusCode: 302 };
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
    refreshSession() {
        return;
    }
    getRedirect() {
        return { url: 'https://example.com', statusCode: 302 };
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
__decorate([
    (0, common_1.Post)('refresh'),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Server error' }),
    openapi.ApiResponse({ status: 201 })
], AppController.prototype, "refreshSession", null);
__decorate([
    (0, common_1.Get)('redirect'),
    (0, common_1.Redirect)(),
    (0, swagger_1.ApiFoundResponse)({ description: 'Redirects to a URL' })
], AppController.prototype, "getRedirect", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('example')
], AppController);
`;
