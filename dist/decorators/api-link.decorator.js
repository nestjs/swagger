"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiLink = ApiLink;
const constants_1 = require("../constants");
function ApiLink({ from, fromField = 'id', routeParam }) {
    return (controllerPrototype, key, descriptor) => {
        var _a;
        const { prototype } = from;
        if (prototype) {
            const links = (_a = Reflect.getMetadata(constants_1.DECORATORS.API_LINK, prototype)) !== null && _a !== void 0 ? _a : [];
            links.push({
                method: descriptor.value,
                prototype: controllerPrototype,
                field: fromField,
                parameter: routeParam
            });
            Reflect.defineMetadata(constants_1.DECORATORS.API_LINK, links, prototype);
        }
        return descriptor;
    };
}
