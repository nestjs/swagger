export const appControllerText = `import { Controller, Post, HttpStatus } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

class Cat {}

class PromiseCat {}

class ObservableCat {}

@Controller('cats')
export class AppController {
  onApplicationBootstrap() {}

  /**
   * create a Cat
   * 
   * @remarks Creating a test cat
   * 
   * @throws {500} Something is wrong.
   * @throws {400} Bad Request.
   * @throws {400} Missing parameters.
   *
   * @returns {Promise<Cat>}
   * @memberof AppController
   */
  @Post()
  async create(): Promise<Cat> {}

  /**
   * create a test Cat
   *
   * @deprecated Use create instead
   * @returns {Promise<Cat>}
   * @memberof AppController
   */
  @Post()
  async testCreate(): Promise<Cat> {}

  /**
   * create a test Cat, not actually deprecated
   *
   * @deprecated
   * @returns {Promise<Cat>}
   * @memberof AppController
   */
  @ApiOperation({ deprecated: false })
  @Post()
  async testCreate2(): Promise<Cat> {}

  /**
   * create a test PromiseCat
   *
   * @returns {Promise<PromiseCat>>}
   * @memberof AppController
   */
  @Post()
  async testCreate3(): Promise<PromiseCat> {}

  /**
   * create a test ObservableCat
   *
   * @returns {Promise<ObservableCat>}
   * @memberof AppController
   */
  @Post()
  async testCreate4(): Promise<ObservableCat> {}

  /**
   * find a Cat
   */
  @ApiOperation({})
  @Get()
  async findOne(): Promise<Cat> {}

  /**
   * find all Cats im comment
   *
   * @returns {Promise<Cat>}
   * @memberof AppController
   */
  @ApiOperation({
    description: 'find all Cats',
  })
  @Get()
  @HttpCode(HttpStatus.NO_CONTENT)
  async findAll(): Promise<Cat[]> {}
}`;

export const appControllerTextTranspiled = `\"use strict\";
Object.defineProperty(exports, \"__esModule\", { value: true });
exports.AppController = void 0;
const openapi = require(\"@nestjs/swagger\");
const common_1 = require(\"@nestjs/common\");
const swagger_1 = require(\"@nestjs/swagger\");
class Cat {
}
class PromiseCat {
}
class ObservableCat {
}
let AppController = exports.AppController = class AppController {
    onApplicationBootstrap() { }
    /**
     * create a Cat
     *
     * @remarks Creating a test cat
     *
     * @throws {500} Something is wrong.
     * @throws {400} Bad Request.
     * @throws {400} Missing parameters.
     *
     * @returns {Promise<Cat>}
     * @memberof AppController
     */
    async create() { }
    /**
     * create a test Cat
     *
     * @deprecated Use create instead
     * @returns {Promise<Cat>}
     * @memberof AppController
     */
    async testCreate() { }
    /**
     * create a test Cat, not actually deprecated
     *
     * @deprecated
     * @returns {Promise<Cat>}
     * @memberof AppController
     */
    async testCreate2() { }
    /**
     * create a test PromiseCat
     *
     * @returns {Promise<PromiseCat>>}
     * @memberof AppController
     */
    async testCreate3() { }
    /**
     * create a test ObservableCat
     *
     * @returns {Promise<ObservableCat>}
     * @memberof AppController
     */
    async testCreate4() { }
    /**
     * find a Cat
     */
    async findOne() { }
    /**
     * find all Cats im comment
     *
     * @returns {Promise<Cat>}
     * @memberof AppController
     */
    async findAll() { }
};
__decorate([
    openapi.ApiOperation({ summary: \"create a Cat\", description: \"Creating a test cat\" }),
    openapi.ApiResponse({ status: 500, description: "Something is wrong." }),
    openapi.ApiResponse({ status: 400, description: "Bad Request." }),
    openapi.ApiResponse({ status: 400, description: "Missing parameters." }),
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201, type: Cat })
], AppController.prototype, \"create\", null);
__decorate([
    openapi.ApiOperation({ summary: \"create a test Cat\", deprecated: true }),
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201, type: Cat })
], AppController.prototype, \"testCreate\", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: \"create a test Cat, not actually deprecated\", deprecated: false }),
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201, type: Cat })
], AppController.prototype, \"testCreate2\", null);
__decorate([
    openapi.ApiOperation({ summary: \"create a test PromiseCat\" }),
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201, type: PromiseCat })
], AppController.prototype, \"testCreate3\", null);
__decorate([
    openapi.ApiOperation({ summary: \"create a test ObservableCat\" }),
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201, type: ObservableCat })
], AppController.prototype, \"testCreate4\", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: \"find a Cat\" }),
    Get(),
    openapi.ApiResponse({ status: 200, type: Cat })
], AppController.prototype, \"findOne\", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: \"find all Cats im comment\", description: 'find all Cats' }),
    Get(),
    HttpCode(common_1.HttpStatus.NO_CONTENT),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT, type: [Cat] })
], AppController.prototype, \"findAll\", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('cats')
], AppController);
`;
