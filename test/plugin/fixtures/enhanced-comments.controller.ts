export const enhancedCommentsControllerText = `import { Controller, Post, HttpStatus } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

class Cat {}

@Controller('cats')
export class EnhancedCommentsController {
  onApplicationBootstrap() {}

  /**
   * create a Cat
   *
   * @remarks
   * Create a super nice cat
   *
   * @returns {Promise<Cat>}
   * @memberof AppController
   */
  @Post()
  async create(): Promise<Cat> {}

  /**
   * find a Cat
   *
   * @remarks
   * Find the best cat in the world
   */
  @ApiOperation({})
  @Get()
  async findOne(): Promise<Cat> {}

  /**
   * find all Cats im comment
   *
   * @remarks
   * Find all cats while you write comments
   *
   * @returns {Promise<Cat>}
   * @memberof AppController
   */
  @ApiOperation({
    summary: 'find all Cats',
    description: 'Find all cats while you write decorators'
  })
  @Get()
  @HttpCode(HttpStatus.NO_CONTENT)
  async findAll(): Promise<Cat[]> {}
}`;

export const enhancedCommentsControllerTextTranspiled = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedCommentsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
class Cat {
}
let EnhancedCommentsController = class EnhancedCommentsController {
    onApplicationBootstrap() { }
    /**
     * create a Cat
     *
     * @remarks
     * Create a super nice cat
     *
     * @returns {Promise<Cat>}
     * @memberof AppController
     */
    async create() { }
    /**
     * find a Cat
     *
     * @remarks
     * Find the best cat in the world
     */
    async findOne() { }
    /**
     * find all Cats im comment
     *
     * @remarks
     * Find all cats while you write comments
     *
     * @returns {Promise<Cat>}
     * @memberof AppController
     */
    async findAll() { }
};
__decorate([
    openapi.ApiOperation({ summary: "create a Cat", description: "Create a super nice cat" }),
    common_1.Post(),
    openapi.ApiResponse({ status: 201, type: Cat })
], EnhancedCommentsController.prototype, "create", null);
__decorate([
    swagger_1.ApiOperation({ summary: "find a Cat", description: "Find the best cat in the world" }),
    Get(),
    openapi.ApiResponse({ status: 200, type: Cat })
], EnhancedCommentsController.prototype, "findOne", null);
__decorate([
    swagger_1.ApiOperation({ summary: 'find all Cats',
        description: 'Find all cats while you write decorators' }),
    Get(),
    HttpCode(common_1.HttpStatus.NO_CONTENT),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT, type: [Cat] })
], EnhancedCommentsController.prototype, "findAll", null);
EnhancedCommentsController = __decorate([
    common_1.Controller('cats')
], EnhancedCommentsController);
exports.EnhancedCommentsController = EnhancedCommentsController;
`;
