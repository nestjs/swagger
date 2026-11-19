export const appControllerThrowsMultilineText = `import { Controller, Delete, Get } from '@nestjs/common';

class Cat {}

@Controller('cats')
export class AppController {
  /**
   * Delete a cat
   *
   * @throws {404} The cat does not exist
   * or was already deleted.
   * @throws
   * {403} Forbidden
   * @throws {409}
   */
  @Delete(':id')
  remove(): void {}

  /**
   * Find a cat
   *
   * @throws {404} Not found
   * @memberof AppController
   */
  @Get(':id')
  findOne(): Cat {
    return new Cat();
  }
}`;

export const appControllerThrowsMultilineTextTranspiled = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
class Cat {
}
let AppController = class AppController {
    /**
     * Delete a cat
     *
     * @throws {404} The cat does not exist
     * or was already deleted.
     * @throws
     * {403} Forbidden
     * @throws {409}
     */
    remove() { }
    /**
     * Find a cat
     *
     * @throws {404} Not found
     * @memberof AppController
     */
    findOne() {
        return new Cat();
    }
};
exports.AppController = AppController;
__decorate([
    openapi.ApiOperation({ summary: "Delete a cat" }),
    openapi.ApiResponse({ status: 404, description: "The cat does not exist or was already deleted." }),
    openapi.ApiResponse({ status: 403, description: "Forbidden" }),
    openapi.ApiResponse({ status: 409, description: "" }),
    (0, common_1.Delete)(':id'),
    openapi.ApiResponse({ status: 200 })
], AppController.prototype, "remove", null);
__decorate([
    openapi.ApiOperation({ summary: "Find a cat" }),
    openapi.ApiResponse({ status: 404, description: "Not found" }),
    (0, common_1.Get)(':id'),
    openapi.ApiResponse({ status: 200, type: Cat })
], AppController.prototype, "findOne", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('cats')
], AppController);
`;
