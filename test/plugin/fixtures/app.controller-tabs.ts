// prettier-ignore
export const appControllerWithTabsText = `import { Controller, Post, HttpStatus } from '@nestjs/common';
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
	async create(): Promise<Cat> {}

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

// prettier-ignore
export const appControllerWithTabsTextTranspiled = `\"use strict\";
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
    async create() { }
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
    openapi.ApiOperation({ summary: \"create a Cat\" }),
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201, type: Cat })
], AppController.prototype, \"create\", null);
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
