export const appControllerParamDescriptionText = `import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiParam, ApiQuery } from '@nestjs/swagger';

class Cat {}

@Controller('cats')
export class AppController {
  /**
   * List cats.
   * @param limit Maximum number of cats to return
   * @param orderBy Field used to order the results
   */
  @Get()
  async findAll(
    @Query('limit') limit?: number,
    @Query('order_by') orderBy?: string,
    @Query('untagged') untagged?: string,
  ): Promise<Cat[]> {}

  /**
   * @param q Search term
   */
  @Get('search')
  async search(@Query('q') q: string): Promise<Cat[]> {}

  /**
   * @param id The cat identifier
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Cat> {}

  /**
   * @param id ignored because an explicit @ApiParam wins
   */
  @ApiParam({ name: 'id', description: 'explicit description' })
  @Get(':id/explicit')
  async findOneExplicit(@Param('id') id: string): Promise<Cat> {}

  /**
   * @param status documented but an explicit @ApiQuery wins
   */
  @ApiQuery({ name: 'status' })
  @Get('by-status')
  async byStatus(@Query('status') status?: string): Promise<Cat[]> {}

  /**
   * @param q Search term with "quotes" and
   *   a wrapped second line
   */
  @Get('special')
  async special(@Query('q') q: string): Promise<Cat[]> {}
}`;

export const appControllerParamDescriptionTextTranspiled = `\"use strict\";
Object.defineProperty(exports, \"__esModule\", { value: true });
exports.AppController = void 0;
const openapi = require(\"@nestjs/swagger\");
const common_1 = require(\"@nestjs/common\");
const swagger_1 = require(\"@nestjs/swagger\");
class Cat {
}
let AppController = class AppController {
    /**
     * List cats.
     * @param limit Maximum number of cats to return
     * @param orderBy Field used to order the results
     */
    async findAll(limit, orderBy, untagged) { }
    /**
     * @param q Search term
     */
    async search(q) { }
    /**
     * @param id The cat identifier
     */
    async findOne(id) { }
    /**
     * @param id ignored because an explicit @ApiParam wins
     */
    async findOneExplicit(id) { }
    /**
     * @param status documented but an explicit @ApiQuery wins
     */
    async byStatus(status) { }
    /**
     * @param q Search term with \"quotes\" and
     *   a wrapped second line
     */
    async special(q) { }
};
exports.AppController = AppController;
__decorate([
    openapi.ApiOperation({ summary: \"List cats.\" }),
    openapi.ApiQuery({ name: \"limit\", required: false, description: \"Maximum number of cats to return\" }),
    openapi.ApiQuery({ name: \"order_by\", required: false, description: \"Field used to order the results\" }),
    openapi.ApiQuery({ name: \"untagged\", required: false }),
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200, type: [Cat] }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('order_by')),
    __param(2, (0, common_1.Query)('untagged'))
], AppController.prototype, \"findAll\", null);
__decorate([
    openapi.ApiQuery({ name: \"q\", description: \"Search term\" }),
    (0, common_1.Get)('search'),
    openapi.ApiResponse({ status: 200, type: [Cat] }),
    __param(0, (0, common_1.Query)('q'))
], AppController.prototype, \"search\", null);
__decorate([
    openapi.ApiParam({ name: \"id\", description: \"The cat identifier\" }),
    (0, common_1.Get)(':id'),
    openapi.ApiResponse({ status: 200, type: Cat }),
    __param(0, (0, common_1.Param)('id'))
], AppController.prototype, \"findOne\", null);
__decorate([
    (0, swagger_1.ApiParam)({ name: 'id', description: 'explicit description' }),
    (0, common_1.Get)(':id/explicit'),
    openapi.ApiResponse({ status: 200, type: Cat }),
    __param(0, (0, common_1.Param)('id'))
], AppController.prototype, \"findOneExplicit\", null);
__decorate([
    (0, swagger_1.ApiQuery)({ name: 'status' }),
    (0, common_1.Get)('by-status'),
    openapi.ApiResponse({ status: 200, type: [Cat] }),
    __param(0, (0, common_1.Query)('status'))
], AppController.prototype, \"byStatus\", null);
__decorate([
    openapi.ApiQuery({ name: \"q\", description: \"Search term with \\\"quotes\\\" and a wrapped second line\" }),
    (0, common_1.Get)('special'),
    openapi.ApiResponse({ status: 200, type: [Cat] }),
    __param(0, (0, common_1.Query)('q'))
], AppController.prototype, \"special\", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('cats')
], AppController);
`;

export const appControllerParamDescriptionNoIntrospectTranspiled = `\"use strict\";
Object.defineProperty(exports, \"__esModule\", { value: true });
exports.AppController = void 0;
const openapi = require(\"@nestjs/swagger\");
const common_1 = require(\"@nestjs/common\");
const swagger_1 = require(\"@nestjs/swagger\");
class Cat {
}
let AppController = class AppController {
    /**
     * List cats.
     * @param limit Maximum number of cats to return
     * @param orderBy Field used to order the results
     */
    async findAll(limit, orderBy, untagged) { }
    /**
     * @param q Search term
     */
    async search(q) { }
    /**
     * @param id The cat identifier
     */
    async findOne(id) { }
    /**
     * @param id ignored because an explicit @ApiParam wins
     */
    async findOneExplicit(id) { }
    /**
     * @param status documented but an explicit @ApiQuery wins
     */
    async byStatus(status) { }
    /**
     * @param q Search term with \"quotes\" and
     *   a wrapped second line
     */
    async special(q) { }
};
exports.AppController = AppController;
__decorate([
    openapi.ApiQuery({ name: \"limit\", required: false }),
    openapi.ApiQuery({ name: \"order_by\", required: false }),
    openapi.ApiQuery({ name: \"untagged\", required: false }),
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200, type: [Cat] }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('order_by')),
    __param(2, (0, common_1.Query)('untagged'))
], AppController.prototype, \"findAll\", null);
__decorate([
    (0, common_1.Get)('search'),
    openapi.ApiResponse({ status: 200, type: [Cat] }),
    __param(0, (0, common_1.Query)('q'))
], AppController.prototype, \"search\", null);
__decorate([
    (0, common_1.Get)(':id'),
    openapi.ApiResponse({ status: 200, type: Cat }),
    __param(0, (0, common_1.Param)('id'))
], AppController.prototype, \"findOne\", null);
__decorate([
    (0, swagger_1.ApiParam)({ name: 'id', description: 'explicit description' }),
    (0, common_1.Get)(':id/explicit'),
    openapi.ApiResponse({ status: 200, type: Cat }),
    __param(0, (0, common_1.Param)('id'))
], AppController.prototype, \"findOneExplicit\", null);
__decorate([
    (0, swagger_1.ApiQuery)({ name: 'status' }),
    (0, common_1.Get)('by-status'),
    openapi.ApiResponse({ status: 200, type: [Cat] }),
    __param(0, (0, common_1.Query)('status'))
], AppController.prototype, \"byStatus\", null);
__decorate([
    (0, common_1.Get)('special'),
    openapi.ApiResponse({ status: 200, type: [Cat] }),
    __param(0, (0, common_1.Query)('q'))
], AppController.prototype, \"special\", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('cats')
], AppController);
`;
