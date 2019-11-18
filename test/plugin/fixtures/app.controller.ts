export const appControllerText = `import { Controller, Post, HttpStatus } from '@nestjs/common';

class Cat {}

@Controller('cats')
export class AppController {
  @Post()
  async create(): Promise<Cat> {}

  @Get()
  @HttpCode(HttpStatus.NO_CONTENT)
  async findAll(): Promise<Cat[]> {}
}`;

export const appControllerTextTranspiled = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
class Cat {
}
let AppController = class AppController {
    async create() { }
    async findAll() { }
};
__decorate([
    common_1.Post(),
    openapi.ApiResponse({ status: 201, type: Cat })
], AppController.prototype, \"create\", null);
__decorate([
    Get(),
    HttpCode(common_1.HttpStatus.NO_CONTENT),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT, type: [Cat] })
], AppController.prototype, "findAll", null);
AppController = __decorate([
    common_1.Controller('cats')
], AppController);
exports.AppController = AppController;
`;
