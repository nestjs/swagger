"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwaggerModule = void 0;
const common_1 = require("@nestjs/common");
const jsyaml = require("js-yaml");
const metadata_loader_1 = require("./plugin/metadata-loader");
const swagger_scanner_1 = require("./swagger-scanner");
const swagger_ui_1 = require("./swagger-ui");
const assign_two_levels_deep_1 = require("./utils/assign-two-levels-deep");
const get_global_prefix_1 = require("./utils/get-global-prefix");
const normalize_rel_path_1 = require("./utils/normalize-rel-path");
const resolve_path_util_1 = require("./utils/resolve-path.util");
const validate_global_prefix_util_1 = require("./utils/validate-global-prefix.util");
const validate_path_util_1 = require("./utils/validate-path.util");
class SwaggerModule {
    static createDocument(app, config, options = {}) {
        const swaggerScanner = new swagger_scanner_1.SwaggerScanner();
        const document = swaggerScanner.scanApplication(app, options);
        document.components = (0, assign_two_levels_deep_1.assignTwoLevelsDeep)({}, config.components, document.components);
        return Object.assign(Object.assign({ openapi: '3.0.0', paths: {} }, config), document);
    }
    static loadPluginMetadata(metadataFn) {
        return __awaiter(this, void 0, void 0, function* () {
            const metadata = yield metadataFn();
            return this.metadataLoader.load(metadata);
        });
    }
    static serveStatic(finalPath, app, customStaticPath) {
        const httpAdapter = app.getHttpAdapter();
        const swaggerAssetsPath = customStaticPath
            ? (0, resolve_path_util_1.resolvePath)(customStaticPath)
            : (0, swagger_ui_1.getSwaggerAssetsAbsoluteFSPath)();
        if (httpAdapter && httpAdapter.getType() === 'fastify') {
            app.useStaticAssets({
                root: swaggerAssetsPath,
                prefix: finalPath,
                decorateReply: false
            });
        }
        else {
            app.useStaticAssets(swaggerAssetsPath, {
                prefix: finalPath
            });
        }
    }
    static serveDocuments(finalPath, urlLastSubdirectory, httpAdapter, documentOrFactory, options) {
        let document;
        const getBuiltDocument = () => {
            if (!document) {
                document =
                    typeof documentOrFactory === 'function'
                        ? documentOrFactory()
                        : documentOrFactory;
            }
            return document;
        };
        if (options.ui) {
            this.serveSwaggerUi(finalPath, urlLastSubdirectory, httpAdapter, getBuiltDocument, options.swaggerOptions);
        }
        if (options.raw === true ||
            (Array.isArray(options.raw) && options.raw.length > 0)) {
            const serveJson = options.raw === true || options.raw.includes('json');
            const serveYaml = options.raw === true || options.raw.includes('yaml');
            this.serveDefinitions(httpAdapter, getBuiltDocument, options, {
                serveJson,
                serveYaml
            });
        }
    }
    static serveSwaggerUi(finalPath, urlLastSubdirectory, httpAdapter, getBuiltDocument, swaggerOptions) {
        const baseUrlForSwaggerUI = (0, normalize_rel_path_1.normalizeRelPath)(`./${urlLastSubdirectory}/`);
        let swaggerUiHtml;
        let swaggerUiInitJS;
        httpAdapter.get((0, normalize_rel_path_1.normalizeRelPath)(`${finalPath}/swagger-ui-init.js`), (req, res) => {
            res.type('application/javascript');
            const document = getBuiltDocument();
            if (swaggerOptions.patchDocumentOnRequest) {
                const documentToSerialize = swaggerOptions.patchDocumentOnRequest(req, res, document);
                const swaggerInitJsPerRequest = (0, swagger_ui_1.buildSwaggerInitJS)(documentToSerialize, swaggerOptions);
                return res.send(swaggerInitJsPerRequest);
            }
            if (!swaggerUiInitJS) {
                swaggerUiInitJS = (0, swagger_ui_1.buildSwaggerInitJS)(document, swaggerOptions);
            }
            res.send(swaggerUiInitJS);
        });
        try {
            httpAdapter.get((0, normalize_rel_path_1.normalizeRelPath)(`${finalPath}/${urlLastSubdirectory}/swagger-ui-init.js`), (req, res) => {
                res.type('application/javascript');
                const document = getBuiltDocument();
                if (swaggerOptions.patchDocumentOnRequest) {
                    const documentToSerialize = swaggerOptions.patchDocumentOnRequest(req, res, document);
                    const swaggerInitJsPerRequest = (0, swagger_ui_1.buildSwaggerInitJS)(documentToSerialize, swaggerOptions);
                    return res.send(swaggerInitJsPerRequest);
                }
                if (!swaggerUiInitJS) {
                    swaggerUiInitJS = (0, swagger_ui_1.buildSwaggerInitJS)(document, swaggerOptions);
                }
                res.send(swaggerUiInitJS);
            });
        }
        catch (_a) {
        }
        function serveSwaggerHtml(_, res) {
            res.type('text/html');
            if (!swaggerUiHtml) {
                swaggerUiHtml = (0, swagger_ui_1.buildSwaggerHTML)(baseUrlForSwaggerUI, swaggerOptions);
            }
            res.send(swaggerUiHtml);
        }
        httpAdapter.get(finalPath, serveSwaggerHtml);
        httpAdapter.get(`${finalPath}/index.html`, serveSwaggerHtml);
        httpAdapter.get(`${finalPath}/LICENSE`, () => {
            throw new common_1.NotFoundException();
        });
        try {
            httpAdapter.get((0, normalize_rel_path_1.normalizeRelPath)(`${finalPath}/`), serveSwaggerHtml);
        }
        catch (_b) {
        }
    }
    static serveDefinitions(httpAdapter, getBuiltDocument, options, serveOptions) {
        if (serveOptions.serveJson) {
            httpAdapter.get((0, normalize_rel_path_1.normalizeRelPath)(options.jsonDocumentUrl), (req, res) => {
                res.type('application/json');
                const document = getBuiltDocument();
                const documentToSerialize = options.swaggerOptions
                    .patchDocumentOnRequest
                    ? options.swaggerOptions.patchDocumentOnRequest(req, res, document)
                    : document;
                res.send(JSON.stringify(documentToSerialize));
            });
        }
        if (serveOptions.serveYaml) {
            httpAdapter.get((0, normalize_rel_path_1.normalizeRelPath)(options.yamlDocumentUrl), (req, res) => {
                res.type('text/yaml');
                const document = getBuiltDocument();
                const documentToSerialize = options.swaggerOptions
                    .patchDocumentOnRequest
                    ? options.swaggerOptions.patchDocumentOnRequest(req, res, document)
                    : document;
                const yamlDocument = jsyaml.dump(documentToSerialize, {
                    skipInvalid: true,
                    noRefs: true
                });
                res.send(yamlDocument);
            });
        }
    }
    static setup(path, app, documentOrFactory, options) {
        var _a, _b, _c;
        const globalPrefix = (0, get_global_prefix_1.getGlobalPrefix)(app);
        const finalPath = (0, validate_path_util_1.validatePath)((options === null || options === void 0 ? void 0 : options.useGlobalPrefix) && (0, validate_global_prefix_util_1.validateGlobalPrefix)(globalPrefix)
            ? `${globalPrefix}${(0, validate_path_util_1.validatePath)(path)}`
            : path);
        const urlLastSubdirectory = finalPath.split('/').slice(-1).pop() || '';
        const validatedGlobalPrefix = (options === null || options === void 0 ? void 0 : options.useGlobalPrefix) && (0, validate_global_prefix_util_1.validateGlobalPrefix)(globalPrefix)
            ? (0, validate_path_util_1.validatePath)(globalPrefix)
            : '';
        const finalJSONDocumentPath = (options === null || options === void 0 ? void 0 : options.jsonDocumentUrl)
            ? `${validatedGlobalPrefix}${(0, validate_path_util_1.validatePath)(options.jsonDocumentUrl)}`
            : `${finalPath}-json`;
        const finalYAMLDocumentPath = (options === null || options === void 0 ? void 0 : options.yamlDocumentUrl)
            ? `${validatedGlobalPrefix}${(0, validate_path_util_1.validatePath)(options.yamlDocumentUrl)}`
            : `${finalPath}-yaml`;
        const ui = (_b = (_a = options === null || options === void 0 ? void 0 : options.ui) !== null && _a !== void 0 ? _a : options === null || options === void 0 ? void 0 : options.swaggerUiEnabled) !== null && _b !== void 0 ? _b : true;
        const raw = (_c = options === null || options === void 0 ? void 0 : options.raw) !== null && _c !== void 0 ? _c : true;
        const httpAdapter = app.getHttpAdapter();
        SwaggerModule.serveDocuments(finalPath, urlLastSubdirectory, httpAdapter, documentOrFactory, {
            ui,
            raw,
            jsonDocumentUrl: finalJSONDocumentPath,
            yamlDocumentUrl: finalYAMLDocumentPath,
            swaggerOptions: options || {}
        });
        if (ui) {
            SwaggerModule.serveStatic(finalPath, app, options === null || options === void 0 ? void 0 : options.customSwaggerUiPath);
            if (finalPath === `/${urlLastSubdirectory}`) {
                return;
            }
            const serveStaticSlashEndingPath = `${finalPath}/${urlLastSubdirectory}`;
            SwaggerModule.serveStatic(serveStaticSlashEndingPath, app);
        }
    }
}
exports.SwaggerModule = SwaggerModule;
SwaggerModule.metadataLoader = new metadata_loader_1.MetadataLoader();
