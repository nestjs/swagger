export const appControllerWithoutModifiersText = `import { Controller, Post, HttpStatus } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

class Cat {}

@Controller('cats')
export class AppController {
  onApplicationBootstrap() {}

  /**
   * create a Cat
   *
   * @returns {Promise<Cat>}
   * @memberof AppController
   */
  @Post()
  create(): Promise<Cat> {}

  /**
   * create a test Cat
   *
   * @deprecated Use create instead
   * @returns {Promise<Cat>}
   * @memberof AppController
   */
  @Post()
  testCreate(): Promise<Cat> {}

  /**
   * create a test Cat, not actually deprecated
   *
   * @deprecated
   * @returns {Promise<Cat>}
   * @memberof AppController
   */
  @ApiOperation({ deprecated: false })
  @Post()
  testCreate2(): Promise<Cat> {}

  /**
   * find a Cat
   */
  @ApiOperation({})
  @Get()
  findOne(): Promise<Cat> {}

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
  findAll(): Promise<Cat[]> {}
  
  @Get()
  @HttpCode(HttpStatus.NO_CONTENT)
  noComment() {}
}`;

export const appControllerWithoutModifiersTextTranspiled = `\"use strict\";
Object.defineProperty(exports, \"__esModule\", { value: true });
exports.AppController = void 0;
const openapi = require(\"@nestjs/swagger\");
const common_1 = require(\"@nestjs/common\");
const swagger_1 = require(\"@nestjs/swagger\");
class Cat {
}
let AppController = exports.AppController = class AppController {
    onApplicationBootstrap() { }
    /**
     * create a Cat
     *
     * @returns {Promise<Cat>}
     * @memberof AppController
     */
    create() { }
    /**
     * create a test Cat
     *
     * @deprecated Use create instead
     * @returns {Promise<Cat>}
     * @memberof AppController
     */
    testCreate() { }
    /**
     * create a test Cat, not actually deprecated
     *
     * @deprecated
     * @returns {Promise<Cat>}
     * @memberof AppController
     */
    testCreate2() { }
    /**
     * find a Cat
     */
    findOne() { }
    /**
     * find all Cats im comment
     *
     * @returns {Promise<Cat>}
     * @memberof AppController
     */
    findAll() { }
    noComment() { }
};
__decorate([
    openapi.ApiOperation({ summary: \"create a Cat\" }),
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
__decorate([
    Get(),
    HttpCode(common_1.HttpStatus.NO_CONTENT),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT })
], AppController.prototype, \"noComment\", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('cats')
], AppController);
`;
