"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalParametersStorage = exports.GlobalParametersStorageHost = void 0;
class GlobalParametersStorageHost {
    constructor() {
        this.parameters = new Array();
    }
    add(...parameters) {
        this.parameters.push(...parameters);
    }
    getAll() {
        return this.parameters;
    }
    clear() {
        this.parameters = [];
    }
}
exports.GlobalParametersStorageHost = GlobalParametersStorageHost;
const globalRef = global;
exports.GlobalParametersStorage = globalRef.SwaggerGlobalParametersStorage ||
    (globalRef.SwaggerGlobalParametersStorage =
        new GlobalParametersStorageHost());
