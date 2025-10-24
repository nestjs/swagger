"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDocumentBase = void 0;
const buildDocumentBase = () => ({
    openapi: '3.0.0',
    info: {
        title: '',
        description: '',
        version: '1.0.0',
        contact: {}
    },
    tags: [],
    servers: [],
    components: {}
});
exports.buildDocumentBase = buildDocumentBase;
