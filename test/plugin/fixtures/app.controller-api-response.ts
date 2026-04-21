export const appControllerApiResponseText = `import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiFoundResponse, ApiOkResponse, ApiResponse } from '@nestjs/swagger';

interface RedirectResponse {
  url: string;
  statusCode?: number;
}

@Controller('example')
export class AppController {
  @Get('redirect')
  @ApiFoundResponse({ description: 'Redirects to a URL' })
  @Redirect()
  getRedirect(): RedirectResponse {
    return {
      url: 'https://example.com',
      statusCode: 302,
    };
  }

  @Get('ok')
  @ApiOkResponse({ description: 'Returns OK' })
  getOk(): string {
    return 'ok';
  }

  @Get('moved')
  @ApiResponse({ status: 301, description: 'Moved permanently' })
  getMoved(): string {
    return 'moved';
  }

  @Get('no-decorator')
  getNoDecorator(): string {
    return 'hello';
  }
}`;

export const appControllerApiResponseTextTranspiled = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let AppController = class AppController {
    getRedirect() {
        return {
            url: 'https://example.com',
            statusCode: 302,
        };
    }
    getOk() {
        return 'ok';
    }
    getMoved() {
        return 'moved';
    }
    getNoDecorator() {
        return 'hello';
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)('redirect'),
    (0, swagger_1.ApiFoundResponse)({ description: 'Redirects to a URL' }),
    (0, common_1.Redirect)()
], AppController.prototype, "getRedirect", null);
__decorate([
    (0, common_1.Get)('ok'),
    (0, swagger_1.ApiOkResponse)({ description: 'Returns OK' })
], AppController.prototype, "getOk", null);
__decorate([
    (0, common_1.Get)('moved'),
    (0, swagger_1.ApiResponse)({ status: 301, description: 'Moved permanently' })
], AppController.prototype, "getMoved", null);
__decorate([
    (0, common_1.Get)('no-decorator'),
    openapi.ApiResponse({ status: 200, type: String })
], AppController.prototype, "getNoDecorator", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('example')
], AppController);
`;
