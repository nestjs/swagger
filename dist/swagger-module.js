"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const swaggerUi = require("swagger-ui-express");
const swagger_scanner_1 = require("./swagger-scanner");
class SwaggerModule {
    static createDocument(app, config) {
        const document = this.swaggerScanner.scanApplication(app);
        return Object.assign({}, config, document, { swagger: '2.0' });
    }
    static setup(path, app, document, options) {
        app.use(path, swaggerUi.serve, swaggerUi.setup(document, options));
    }
}
SwaggerModule.swaggerScanner = new swagger_scanner_1.SwaggerScanner();
exports.SwaggerModule = SwaggerModule;
