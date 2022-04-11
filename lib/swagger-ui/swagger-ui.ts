import * as swaggerUi from 'swagger-ui-dist';
import { favIconHtml, htmlTemplateString, jsTemplateString } from './constants';
import { SwaggerCustomOptions } from '../interfaces';

const buildJSInitOptions = (obj) => {
  const placeholder = '____FUNCTIONPLACEHOLDER____';
  const fns = [];
  let json = JSON.stringify(
    obj,
    function (key, value) {
      if (typeof value === 'function') {
        fns.push(value);
        return placeholder;
      }
      return value;
    },
    2
  );

  json = json.replace(new RegExp('"' + placeholder + '"', 'g'), function (_) {
    return fns.shift();
  });

  return `let options = ${json};`;
};

export const buildSwaggerHTML = function (
  baseUrl,
  swaggerDoc,
  options: SwaggerCustomOptions
) {
  const customCss = options?.customCss ?? '';
  const customJs = options?.customJs ?? '';
  const customfavIcon = options?.customfavIcon ?? false;
  const customSiteTitle = options?.customSiteTitle ?? 'Swagger UI';
  const customCssUrl = options?.customCssUrl ?? '';

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
};

export const buildSwaggerInitJS = (
  swaggerDoc,
  options: SwaggerCustomOptions = {}
) => {
  const initOptions = {
    swaggerDoc: swaggerDoc ?? undefined,
    customOptions: options.swaggerOptions ?? {},
    swaggerUrl: options.swaggerUrl ?? {}
  };

  return jsTemplateString
    .toString()
    .replace('<% swaggerOptions %>', buildJSInitOptions(initOptions));
};

export const swaggerAssetsAbsoluteFSPath = swaggerUi.getAbsoluteFSPath();
