import { OpenAPIObject, SwaggerCustomOptions } from '../interfaces';
import { favIconHtml, htmlTemplateString, jsTemplateString } from './constants';
import { buildJSInitOptions } from './helpers';

/**
 * Used to create swagger ui initialization js file (
 */
export function buildSwaggerInitJS(
  swaggerDoc: OpenAPIObject,
  customOptions: SwaggerCustomOptions = {}
) {
  const { swaggerOptions = {}, swaggerUrl } = customOptions;
  const swaggerInitOptions = {
    swaggerDoc,
    swaggerUrl,
    customOptions: swaggerOptions
  };

  const jsInitOptions = buildJSInitOptions(swaggerInitOptions);
  return jsTemplateString.replace('<% swaggerOptions %>', jsInitOptions);
}

let swaggerAssetsAbsoluteFSPath: string | undefined;

/**
 * Returns the absolute path to swagger-ui assets.
 */
export function getSwaggerAssetsAbsoluteFSPath() {
  if (!swaggerAssetsAbsoluteFSPath) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    swaggerAssetsAbsoluteFSPath = require('swagger-ui-dist/absolute-path.js')();
  }

  return swaggerAssetsAbsoluteFSPath;
}

function toExternalScriptTag(url: string) {
  return `<script src='${url}'></script>`;
}

function toInlineScriptTag(jsCode: string) {
  return `<script>${jsCode}</script>`;
}

function toExternalStylesheetTag(url: string) {
  return `<link href='${url}' rel='stylesheet'>`;
}

function toTags(
  customCode: string | string[] | undefined,
  toScript: (url: string) => string
) {
  if (!customCode) {
    return '';
  }

  if (typeof customCode === 'string') {
    return toScript(customCode);
  } else {
    return customCode.map(toScript).join('\n');
  }
}

/**
 * Used to build swagger-ui custom html
 */
export function buildSwaggerHTML(
  baseUrl: string,
  customOptions: SwaggerCustomOptions = {}
) {
  const {
    customCss = '',
    customJs = '',
    customJsStr = '',
    customfavIcon = false,
    customSiteTitle = 'Swagger UI',
    customCssUrl = '',
    explorer = false
  } = customOptions;

  const favIconString = customfavIcon
    ? `<link rel='icon' href='${customfavIcon}' />`
    : favIconHtml;

  const explorerCss = explorer
    ? ''
    : '.swagger-ui .topbar .download-url-wrapper { display: none }';
  return htmlTemplateString
    .replace('<% customCss %>', customCss)
    .replace('<% explorerCss %>', explorerCss)
    .replace('<% favIconString %>', favIconString)
    .replace(/<% baseUrl %>/g, baseUrl)
    .replace('<% customJs %>', toTags(customJs, toExternalScriptTag))
    .replace('<% customJsStr %>', toTags(customJsStr, toInlineScriptTag))
    .replace(
      '<% customCssUrl %>',
      toTags(customCssUrl, toExternalStylesheetTag)
    )
    .replace('<% title %>', customSiteTitle);
}
