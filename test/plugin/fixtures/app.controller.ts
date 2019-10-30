export const appControllerText = `import { Controller, Post } from '@nestjs/common';

class Cat {}

@Controller('cats')
export class AppController {
  @Post()
  async create(): Promise<Cat> {}

  @Get()
  @HttpCode(204)
  async findAll(): Promise<Cat[]> {}
}`;

export const appControllerTextTranspiled = `import { Controller, Post } from '@nestjs/common';
class Cat {
}
let AppController = class AppController {
    async create() { }
    async findAll() { }
};
__decorate([
    Post(),
    openapi.ApiResponse({ status: 201, type: Cat })
], AppController.prototype, \"create\", null);
__decorate([
    Get(),
    HttpCode(204),
    openapi.ApiResponse({ status: 204, type: [Cat] })
], AppController.prototype, "findAll", null);
AppController = __decorate([
    Controller('cats')
], AppController);
export { AppController };
`;
