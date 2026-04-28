export const appControllerOptionalQueryText = `import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

class Cat {}

@Controller('cats')
export class AppController {
  @Get()
  async findWithOptional(
    @Query('limit') limit?: number,
    @Query('offset') offset: number = 0,
    @Query('sort') sort: string | undefined,
    @Query('search') search: string,
  ): Promise<Cat[]> {}

  @ApiQuery({ name: 'search', description: 'free text search', required: false })
  @Get()
  async findPreservingExplicit(
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ): Promise<Cat[]> {}

  @Get()
  async findWithFullQuery(@Query() query?: any): Promise<Cat[]> {}
}`;

export const appControllerOptionalQueryTextTranspiled = `\"use strict\";
Object.defineProperty(exports, \"__esModule\", { value: true });
exports.AppController = void 0;
const openapi = require(\"@nestjs/swagger\");
const common_1 = require(\"@nestjs/common\");
const swagger_1 = require(\"@nestjs/swagger\");
class Cat {
}
let AppController = class AppController {
    async findWithOptional(limit, offset = 0, sort, search) { }
    async findPreservingExplicit(limit, search) { }
    async findWithFullQuery(query) { }
};
exports.AppController = AppController;
__decorate([
    openapi.ApiQuery({ name: \"limit\", required: false }),
    openapi.ApiQuery({ name: \"offset\", required: false }),
    openapi.ApiQuery({ name: \"sort\", required: false }),
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200, type: [Cat] }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('offset')),
    __param(2, (0, common_1.Query)('sort')),
    __param(3, (0, common_1.Query)('search'))
], AppController.prototype, \"findWithOptional\", null);
__decorate([
    openapi.ApiQuery({ name: \"limit\", required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', description: 'free text search', required: false }),
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200, type: [Cat] }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('search'))
], AppController.prototype, \"findPreservingExplicit\", null);
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200, type: [Cat] }),
    __param(0, (0, common_1.Query)())
], AppController.prototype, \"findWithFullQuery\", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('cats')
], AppController);
`;
