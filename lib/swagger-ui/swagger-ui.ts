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
  // Cannot dynamically compute integrity: https://github.com/nestjs/swagger/issues/2667#issuecomment-1780515512
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

function toExternalScriptTag(url: string, integrity?: string) {
  // Cannot dynamically compute integrity: https://github.com/nestjs/swagger/issues/2667#issuecomment-1780515512
  return `<script src='${url}' ${
    !!integrity ? `integrity="${integrity}"` : ''
  }></script>`.replace(/\s+>/g, '>');
}

function toInlineScriptTag(jsCode: string, integrity?: string) {
  // Cannot dynamically compute integrity: https://github.com/nestjs/swagger/issues/2667#issuecomment-1780515512
  return `<script ${
    !!integrity ? `integrity="${integrity}"` : ''
  }>${jsCode}</script>`.replace(/\s+>/g, '>');
}

function toExternalStylesheetTag(url: string, integrity?: string) {
  // Cannot dynamically compute integrity: https://github.com/nestjs/swagger/issues/2667#issuecomment-1780515512
  return `<link href='${url}' rel='stylesheet' ${
    !!integrity ? `integrity="${integrity}"` : ''
  }>`.replace(/\s+>/g, '>');
}

function toTags(
  customCode: string | string[] | undefined,
  integrity: typeof customCode,
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
  swaggerDoc: OpenAPIObject,
  customOptions: SwaggerCustomOptions = {}
) {
  const {
    customCss = '',
    customJs: { customJs = '', customJsIntegrity = null },
    customJsStr: { customJsStr = '', customJsStrIntegrity = null },
    customfavIcon = false,
    customSiteTitle = 'Swagger UI',
    customCssUrl: { customCssUrl = '', customCssUrlIntegrity = null },
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
    .replace(
      '<% customJs %>',
      toTags(customJs, customJsIntegrity, toExternalScriptTag)
    )
    .replace(
      '<% customJsStr %>',
      toTags(customJsStr, customJsStrIntegrity, toInlineScriptTag)
    )
    .replace(
      '<% customCssUrl %>',
      toTags(customCssUrl, customCssUrlIntegrity, toExternalStylesheetTag)
    )
    .replace('<% title %>', customSiteTitle);
}
