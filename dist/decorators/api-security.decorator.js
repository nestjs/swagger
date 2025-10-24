"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiSecurity = ApiSecurity;
const lodash_1 = require("lodash");
const constants_1 = require("../constants");
const extend_metadata_util_1 = require("../utils/extend-metadata.util");
function ApiSecurity(name, requirements = []) {
    let metadata;
    if ((0, lodash_1.isString)(name)) {
        metadata = [{ [name]: requirements }];
    }
    else {
        metadata = [name];
    }
    return (target, key, descriptor) => {
        if (descriptor) {
            metadata = (0, extend_metadata_util_1.extendMetadata)(metadata, constants_1.DECORATORS.API_SECURITY, descriptor.value);
            Reflect.defineMetadata(constants_1.DECORATORS.API_SECURITY, metadata, descriptor.value);
            return descriptor;
        }
        metadata = (0, extend_metadata_util_1.extendMetadata)(metadata, constants_1.DECORATORS.API_SECURITY, target);
        Reflect.defineMetadata(constants_1.DECORATORS.API_SECURITY, metadata, target);
        return target;
    };
}
