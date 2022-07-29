import * as swaggerUi from 'swagger-ui-dist';
import { favIconHtml, htmlTemplateString, jsTemplateString } from './constants';
import { OpenAPIObject, SwaggerCustomOptions } from '../interfaces';
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

/**
 * Stores absolute path to swagger-ui assets
 */
export const swaggerAssetsAbsoluteFSPath = swaggerUi.getAbsoluteFSPath();
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
    customJs = '',
    customfavIcon = false,
    customSiteTitle = 'Swagger UI',
    customCssUrl = ''
  } = customOptions;

  const favIconString = customfavIcon
    ? `<link rel="icon" href="${customfavIcon}" />`
    : favIconHtml;

  return htmlTemplateString
    .replace('<% customCss %>', customCss)
    .replace('<% favIconString %>', favIconString)
    .replace(/<% baseUrl %>/g, baseUrl)
    .replace(
      '<% customJs %>',
      customJs ? `<script src="${customJs}"></script>` : ''
    )
    .replace(
      '<% customCssUrl %>',
      customCssUrl ? `<link href="${customCssUrl}" rel="stylesheet">` : ''
    )
    .replace('<% title %>', customSiteTitle);
}
