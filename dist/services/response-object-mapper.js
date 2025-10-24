"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseObjectMapper = void 0;
const lodash_1 = require("lodash");
const utils_1 = require("../utils");
const mimetype_content_wrapper_1 = require("./mimetype-content-wrapper");
class ResponseObjectMapper {
    constructor() {
        this.mimetypeContentWrapper = new mimetype_content_wrapper_1.MimetypeContentWrapper();
    }
    toArrayRefObject(response, name, produces) {
        const exampleKeys = ['example', 'examples'];
        return Object.assign(Object.assign({}, (0, lodash_1.omit)(response, exampleKeys)), this.mimetypeContentWrapper.wrap(produces, Object.assign({ schema: {
                type: 'array',
                items: {
                    $ref: (0, utils_1.getSchemaPath)(name)
                }
            } }, (0, lodash_1.pick)(response, exampleKeys))));
    }
    toRefObject(response, name, produces) {
        const exampleKeys = ['example', 'examples'];
        return Object.assign(Object.assign({}, (0, lodash_1.omit)(response, exampleKeys)), this.mimetypeContentWrapper.wrap(produces, Object.assign({ schema: {
                $ref: (0, utils_1.getSchemaPath)(name)
            } }, (0, lodash_1.pick)(response, exampleKeys))));
    }
    wrapSchemaWithContent(response, produces) {
        if (!response.schema &&
            !('example' in response) &&
            !('examples' in response)) {
            return response;
        }
        const exampleKeys = ['example', 'examples'];
        const content = this.mimetypeContentWrapper.wrap(produces, Object.assign({ schema: response.schema }, (0, lodash_1.pick)(response, exampleKeys)));
        const keysToOmit = [...exampleKeys, 'schema'];
        return Object.assign(Object.assign({}, (0, lodash_1.omit)(response, keysToOmit)), content);
    }
}
exports.ResponseObjectMapper = ResponseObjectMapper;
