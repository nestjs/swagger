import { SwaggerUIInitOptions } from '../interfaces/swagger-ui-init-options.interface';

/**
 * Transforms options JS object into a string that can be inserted as 'variable' into JS file
 */
export function buildJSInitOptions(initOptions: SwaggerUIInitOptions) {
  const functionPlaceholder = '____FUNCTION_PLACEHOLDER____';
  const fns = [];
  let json = JSON.stringify(
    initOptions,
    (key, value) => {
      if (typeof value === 'function') {
        fns.push(value);
        return functionPlaceholder;
      }
      return value;
    },
    2
  );

  json = json.replace(new RegExp('"' + functionPlaceholder + '"', 'g'), () =>
    fns.shift()
  );

  return `let options = ${json};`;
}
