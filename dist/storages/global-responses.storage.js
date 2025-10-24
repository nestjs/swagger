"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalResponsesStorage = exports.GlobalResponsesStorageHost = void 0;
class GlobalResponsesStorageHost {
    constructor() {
        this.responses = {};
    }
    add(responses) {
        this.responses = Object.assign(Object.assign({}, this.responses), responses);
    }
    getAll() {
        return this.responses;
    }
    clear() {
        this.responses = {};
    }
}
exports.GlobalResponsesStorageHost = GlobalResponsesStorageHost;
const globalRef = global;
exports.GlobalResponsesStorage = globalRef.SwaggerGlobalResponsesStorage ||
    (globalRef.SwaggerGlobalResponsesStorage = new GlobalResponsesStorageHost());
