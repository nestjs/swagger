export const appControllerApiOperationDedupeText = `import { Controller, Get } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

class Cat {}

@Controller('cats')
export class AppController {
  /**
   * auto-generated summary
   */
  @ApiOperation({ summary: 'user-supplied summary' })
  @Get('a')
  a(): Cat {
    return new Cat();
  }

  /**
   * auto-generated summary
   *
   * @remarks user remark
   */
  @ApiOperation({ summary: 'user-supplied summary' })
  @Get('b')
  b(): Cat {
    return new Cat();
  }
}`;

export const appControllerApiOperationDedupeTextTranspiled = `\"use strict\";
Object.defineProperty(exports, \"__esModule\", { value: true });
exports.AppController = void 0;
const openapi = require(\"@nestjs/swagger\");
const common_1 = require(\"@nestjs/common\");
const swagger_1 = require(\"@nestjs/swagger\");
class Cat {
}
let AppController = class AppController {
    /**
     * auto-generated summary
     */
    a() {
        return new Cat();
    }
    /**
     * auto-generated summary
     *
     * @remarks user remark
     */
    b() {
        return new Cat();
    }
};
exports.AppController = AppController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'user-supplied summary' }),
    (0, common_1.Get)('a'),
    openapi.ApiResponse({ status: 200, type: Cat })
], AppController.prototype, \"a\", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'user-supplied summary', description: \"user remark\" }),
    (0, common_1.Get)('b'),
    openapi.ApiResponse({ status: 200, type: Cat })
], AppController.prototype, \"b\", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('cats')
], AppController);
`;
