export const appControllerPromisePrefixText = `import { Controller, Get } from '@nestjs/common';

class Cat {}

class MyPromise<T> {
  value: T;
}

class AsyncObservable<T> {
  value: T;
}

@Controller('cats')
export class AppController {
  /**
   * Standard Promise should still unwrap to the inner type.
   */
  @Get()
  findStandard(): Promise<Cat> { return null; }

  /**
   * MyPromise is a user-defined class that just happens to end with the
   * word "Promise"; the inner Cat type must NOT replace it.
   */
  @Get()
  findCustomPromise(): MyPromise<Cat> { return null; }

  /**
   * Same problem for any name that ends with "Observable".
   */
  @Get()
  findCustomObservable(): AsyncObservable<Cat> { return null; }
}`;

export const appControllerPromisePrefixTextTranspiled = `\"use strict\";
Object.defineProperty(exports, \"__esModule\", { value: true });
exports.AppController = void 0;
const openapi = require(\"@nestjs/swagger\");
const common_1 = require(\"@nestjs/common\");
class Cat {
}
class MyPromise {
}
class AsyncObservable {
}
let AppController = class AppController {
    /**
     * Standard Promise should still unwrap to the inner type.
     */
    findStandard() { return null; }
    /**
     * MyPromise is a user-defined class that just happens to end with the
     * word \"Promise\"; the inner Cat type must NOT replace it.
     */
    findCustomPromise() { return null; }
    /**
     * Same problem for any name that ends with \"Observable\".
     */
    findCustomObservable() { return null; }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200, type: Cat })
], AppController.prototype, \"findStandard\", null);
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 })
], AppController.prototype, \"findCustomPromise\", null);
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 })
], AppController.prototype, \"findCustomObservable\", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('cats')
], AppController);
`;
