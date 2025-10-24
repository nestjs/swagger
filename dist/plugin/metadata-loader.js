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
exports.MetadataLoader = void 0;
const plugin_constants_1 = require("./plugin-constants");
class MetadataLoader {
    static addRefreshHook(hook) {
        return MetadataLoader.refreshHooks.push(hook);
    }
    load(metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            const pkgMetadata = metadata['@nestjs/swagger'];
            if (!pkgMetadata) {
                return;
            }
            const { models, controllers } = pkgMetadata;
            if (models) {
                yield this.applyMetadata(models);
            }
            if (controllers) {
                yield this.applyMetadata(controllers);
            }
            this.runHooks();
        });
    }
    applyMetadata(meta) {
        return __awaiter(this, void 0, void 0, function* () {
            const loadPromises = meta.map((_a) => __awaiter(this, [_a], void 0, function* ([fileImport, fileMeta]) {
                const fileRef = yield fileImport;
                Object.keys(fileMeta).map((key) => {
                    const clsRef = fileRef[key];
                    clsRef[plugin_constants_1.METADATA_FACTORY_NAME] = () => fileMeta[key];
                });
            }));
            yield Promise.all(loadPromises);
        });
    }
    runHooks() {
        MetadataLoader.refreshHooks.forEach((hook) => hook());
    }
}
exports.MetadataLoader = MetadataLoader;
MetadataLoader.refreshHooks = new Array();
