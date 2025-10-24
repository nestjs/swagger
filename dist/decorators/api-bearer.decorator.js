"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiBearerAuth = ApiBearerAuth;
const api_security_decorator_1 = require("./api-security.decorator");
function ApiBearerAuth(name = 'bearer') {
    return (0, api_security_decorator_1.ApiSecurity)(name);
}
