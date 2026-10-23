export const appControllerApiOperationArgsText = `import { Controller, Get, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

class Cat {}

const findAllOperation = { operationId: 'findAllCats', tags: ['cats'] };
const baseOperation = { tags: ['cats'] };

@Controller('cats')
export class AppController {
  /**
   * Finds all cats
   */
  @ApiOperation(findAllOperation)
  @Get()
  findAll(): Cat[] {
    return [];
  }

  /**
   * Creates a cat
   *
   * @remarks Stores the cat
   */
  @ApiOperation({ ...baseOperation, operationId: 'createCat' })
  @Post()
  create(): Cat {
    return new Cat();
  }

  /**
   * Finds a cat
   */
  @ApiOperation({ operationId: 'findOneCat' }, { overrideExisting: false })
  @Get(':id')
  findOne(): Cat {
    return new Cat();
  }
}`;

export const appControllerApiOperationArgsTextTranspiled = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
class Cat {
}
const findAllOperation = { operationId: 'findAllCats', tags: ['cats'] };
const baseOperation = { tags: ['cats'] };
let AppController = class AppController {
    /**
     * Finds all cats
     */
    findAll() {
        return [];
    }
    /**
     * Creates a cat
     *
     * @remarks Stores the cat
     */
    create() {
        return new Cat();
    }
    /**
     * Finds a cat
     */
    findOne() {
        return new Cat();
    }
};
exports.AppController = AppController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Finds all cats", ...findAllOperation }),
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200, type: [Cat] })
], AppController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Creates a cat", description: "Stores the cat", ...baseOperation, operationId: 'createCat' }),
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201, type: Cat })
], AppController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Finds a cat", operationId: 'findOneCat' }, { overrideExisting: false }),
    (0, common_1.Get)(':id'),
    openapi.ApiResponse({ status: 200, type: Cat })
], AppController.prototype, "findOne", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('cats')
], AppController);
`;
