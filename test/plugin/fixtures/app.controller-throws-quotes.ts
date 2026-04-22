export const appControllerThrowsQuotesText = `import { Controller, Post } from '@nestjs/common';

class Cat {}

@Controller('cats')
export class AppController {
  /**
   * create
   *
   * @throws {400} foo "bar".
   * @throws {500} line one
   * line two
   */
  @Post()
  a(): Cat {
    return new Cat();
  }
}`;

export const appControllerThrowsQuotesTextTranspiled = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
class Cat {
}
let AppController = class AppController {
    /**
     * create
     *
     * @throws {400} foo "bar".
     * @throws {500} line one
     * line two
     */
    a() {
        return new Cat();
    }
};
exports.AppController = AppController;
__decorate([
    openapi.ApiOperation({ summary: "create" }),
    openapi.ApiResponse({ status: 400, description: "foo \\"bar\\"." }),
    openapi.ApiResponse({ status: 500, description: "line one" }),
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201, type: Cat })
], AppController.prototype, "a", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('cats')
], AppController);
`;
