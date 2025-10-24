"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiOAuth2 = ApiOAuth2;
const api_security_decorator_1 = require("./api-security.decorator");
function ApiOAuth2(scopes, name = 'oauth2') {
    return (0, api_security_decorator_1.ApiSecurity)(name, scopes);
}
