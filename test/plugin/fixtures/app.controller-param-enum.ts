export const appControllerParamEnumText = `import { Controller, Get, Param } from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';

type Color = 'red' | 'blue';

class Item {}

@Controller('items')
export class AppController {
  @Get(':code')
  findOne(@Param('code') code: Color): Item {}

  @Get('inline/:variant')
  findInline(@Param('variant') variant: 'a' | 'b' | 'c'): Item {}

  @Get('priority/:level')
  findNumeric(@Param('level') level: 1 | 2 | 3): Item {}

  @ApiParam({ name: 'kind', enum: ['x', 'y'] })
  @Get('explicit/:kind')
  findExplicit(@Param('kind') kind: Color): Item {}

  @Get('plain/:id')
  findPlain(@Param('id') id: string): Item {}

  @Get('all')
  findAll(@Param() params: any): Item {}
}`;

export const appControllerParamEnumTextTranspiled = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
class Item {
}
let AppController = class AppController {
    findOne(code) { }
    findInline(variant) { }
    findNumeric(level) { }
    findExplicit(kind) { }
    findPlain(id) { }
    findAll(params) { }
};
exports.AppController = AppController;
__decorate([
    openapi.ApiParam({ name: "code", enum: ["red", "blue"] }),
    (0, common_1.Get)(':code'),
    openapi.ApiResponse({ status: 200, type: Item }),
    __param(0, (0, common_1.Param)('code'))
], AppController.prototype, "findOne", null);
__decorate([
    openapi.ApiParam({ name: "variant", enum: ["a", "b", "c"] }),
    (0, common_1.Get)('inline/:variant'),
    openapi.ApiResponse({ status: 200, type: Item }),
    __param(0, (0, common_1.Param)('variant'))
], AppController.prototype, "findInline", null);
__decorate([
    openapi.ApiParam({ name: "level", enum: [1, 2, 3] }),
    (0, common_1.Get)('priority/:level'),
    openapi.ApiResponse({ status: 200, type: Item }),
    __param(0, (0, common_1.Param)('level'))
], AppController.prototype, "findNumeric", null);
__decorate([
    (0, swagger_1.ApiParam)({ name: 'kind', enum: ['x', 'y'] }),
    (0, common_1.Get)('explicit/:kind'),
    openapi.ApiResponse({ status: 200, type: Item }),
    __param(0, (0, common_1.Param)('kind'))
], AppController.prototype, "findExplicit", null);
__decorate([
    (0, common_1.Get)('plain/:id'),
    openapi.ApiResponse({ status: 200, type: Item }),
    __param(0, (0, common_1.Param)('id'))
], AppController.prototype, "findPlain", null);
__decorate([
    (0, common_1.Get)('all'),
    openapi.ApiResponse({ status: 200, type: Item }),
    __param(0, (0, common_1.Param)())
], AppController.prototype, "findAll", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('items')
], AppController);
`;
