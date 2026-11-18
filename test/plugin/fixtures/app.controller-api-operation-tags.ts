export const appControllerApiOperationTagsText = `import { Controller, Get } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

class Cat {}

@Controller('cats')
export class AppController {
  /**
   * @deprecated Use the v2 endpoint instead
   */
  @Get()
  findAll(): Cat[] {
    return [];
  }

  /**
   * @remarks Returns the cat with the given id.
   */
  @Get(':id')
  findOne(): Cat {
    return new Cat();
  }

  /**
   * @deprecated
   */
  @ApiOperation({ summary: 'Find old cats' })
  @Get('old')
  findOld(): Cat[] {
    return [];
  }

  @Get('count')
  count(): number {
    return 0;
  }
}`;

export const appControllerApiOperationTagsTextTranspiled = `\"use strict\";
Object.defineProperty(exports, \"__esModule\", { value: true });
exports.AppController = void 0;
const openapi = require(\"@nestjs/swagger\");
const common_1 = require(\"@nestjs/common\");
const swagger_1 = require(\"@nestjs/swagger\");
class Cat {
}
let AppController = class AppController {
    /**
     * @deprecated Use the v2 endpoint instead
     */
    findAll() {
        return [];
    }
    /**
     * @remarks Returns the cat with the given id.
     */
    findOne() {
        return new Cat();
    }
    /**
     * @deprecated
     */
    findOld() {
        return [];
    }
    count() {
        return 0;
    }
};
exports.AppController = AppController;
__decorate([
    openapi.ApiOperation({ deprecated: true }, { overrideExisting: false }),
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200, type: [Cat] })
], AppController.prototype, \"findAll\", null);
__decorate([
    openapi.ApiOperation({ description: \"Returns the cat with the given id.\" }, { overrideExisting: false }),
    (0, common_1.Get)(':id'),
    openapi.ApiResponse({ status: 200, type: Cat })
], AppController.prototype, \"findOne\", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Find old cats', deprecated: true }),
    (0, common_1.Get)('old'),
    openapi.ApiResponse({ status: 200, type: [Cat] })
], AppController.prototype, \"findOld\", null);
__decorate([
    (0, common_1.Get)('count'),
    openapi.ApiResponse({ status: 200, type: Number })
], AppController.prototype, \"count\", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('cats')
], AppController);
`;
