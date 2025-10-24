"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clonePluginMetadataFactory = clonePluginMetadataFactory;
const lodash_1 = require("lodash");
const plugin_constants_1 = require("../plugin/plugin-constants");
function clonePluginMetadataFactory(target, parent, transformFn = lodash_1.identity) {
    let targetMetadata = {};
    do {
        if (!parent.constructor) {
            return;
        }
        if (!parent.constructor[plugin_constants_1.METADATA_FACTORY_NAME]) {
            continue;
        }
        const parentMetadata = parent.constructor[plugin_constants_1.METADATA_FACTORY_NAME]();
        targetMetadata = Object.assign(Object.assign({}, parentMetadata), targetMetadata);
    } while ((parent = Reflect.getPrototypeOf(parent)) &&
        parent !== Object.prototype &&
        parent);
    targetMetadata = transformFn(targetMetadata);
    if (target[plugin_constants_1.METADATA_FACTORY_NAME]) {
        const originalFactory = target[plugin_constants_1.METADATA_FACTORY_NAME];
        target[plugin_constants_1.METADATA_FACTORY_NAME] = () => {
            const originalMetadata = originalFactory();
            return Object.assign(Object.assign({}, originalMetadata), targetMetadata);
        };
    }
    else {
        target[plugin_constants_1.METADATA_FACTORY_NAME] = () => targetMetadata;
    }
}
