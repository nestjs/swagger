"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSwaggerInitJS = buildSwaggerInitJS;
exports.getSwaggerAssetsAbsoluteFSPath = getSwaggerAssetsAbsoluteFSPath;
exports.buildSwaggerHTML = buildSwaggerHTML;
const constants_1 = require("./constants");
const helpers_1 = require("./helpers");
function buildSwaggerInitJS(swaggerDoc, customOptions = {}) {
    const { swaggerOptions = {}, swaggerUrl } = customOptions;
    const swaggerInitOptions = {
        swaggerDoc,
        swaggerUrl,
        customOptions: swaggerOptions
    };
    const jsInitOptions = (0, helpers_1.buildJSInitOptions)(swaggerInitOptions);
    return constants_1.jsTemplateString.replace('<% swaggerOptions %>', jsInitOptions);
}
let swaggerAssetsAbsoluteFSPath;
function getSwaggerAssetsAbsoluteFSPath() {
    if (!swaggerAssetsAbsoluteFSPath) {
        swaggerAssetsAbsoluteFSPath = require('swagger-ui-dist/absolute-path.js')();
    }
    return swaggerAssetsAbsoluteFSPath;
}
function toExternalScriptTag(url) {
    return `<script src='${url}'></script>`;
}
function toInlineScriptTag(jsCode) {
    return `<script>${jsCode}</script>`;
}
function toExternalStylesheetTag(url) {
    return `<link href='${url}' rel='stylesheet'>`;
}
function toTags(customCode, toScript) {
    if (!customCode) {
        return '';
    }
    if (typeof customCode === 'string') {
        return toScript(customCode);
    }
    else {
        return customCode.map(toScript).join('\n');
    }
}
function buildSwaggerHTML(baseUrl, customOptions = {}) {
    const { customCss = '', customJs = '', customJsStr = '', customfavIcon = false, customSiteTitle = 'Swagger UI', customCssUrl = '', explorer = false } = customOptions;
    const favIconString = customfavIcon
        ? `<link rel='icon' href='${customfavIcon}' />`
        : constants_1.favIconHtml;
    const explorerCss = explorer
        ? ''
        : '.swagger-ui .topbar .download-url-wrapper { display: none }';
    return constants_1.htmlTemplateString
        .replace('<% customCss %>', customCss)
        .replace('<% explorerCss %>', explorerCss)
        .replace('<% favIconString %>', favIconString)
        .replace(/<% baseUrl %>/g, baseUrl)
        .replace('<% customJs %>', toTags(customJs, toExternalScriptTag))
        .replace('<% customJsStr %>', toTags(customJsStr, toInlineScriptTag))
        .replace('<% customCssUrl %>', toTags(customCssUrl, toExternalStylesheetTag))
        .replace('<% title %>', customSiteTitle);
}
