import { randomUUID } from 'crypto';
import { SwaggerUIInitOptions } from '../interfaces/swagger-ui-init-options.interface.js';

const EXPRESSION_SOURCE = /^(async\s+)?(function\b|class\b|\(|[\w$]+\s*=>)/;

/**
 * Method shorthand (`{ intercept(req) {} }`) stringifies to a source that is
 * not a valid expression, so it is read back from an object literal by name
 */
function serializeFunction(fn: Function): string {
  const source = fn.toString();
  return EXPRESSION_SOURCE.test(source)
    ? source
    : `({ ${source} })[${JSON.stringify(fn.name)}]`;
}

/**
 * Transforms options JS object into a string that can be inserted as 'variable' into JS file
 */
export function buildJSInitOptions(initOptions: SwaggerUIInitOptions) {
  const fns: Function[] = [];
  const placeholders: string[] = [];

  let json = JSON.stringify(
    initOptions,
    (key, value) => {
      if (typeof value === 'function') {
        const placeholder = randomUUID();
        fns.push(value);
        placeholders.push(placeholder);
        return placeholder;
      }
      return value;
    },
    2
  );

  // Replace each UUID placeholder with its function body using exact string
  // matching — a global regex with a fixed pattern would be guessable by an
  // attacker who controls document field values.
  // The replacement is passed via a callback rather than as a string so that
  // `$&`, `$1`-`$9`, "$`", "$'", and `$$` inside the function body are not
  // interpreted as `String.prototype.replace` substitution patterns. Without
  // this, a user-defined callback such as a `requestInterceptor` that calls
  // `String.prototype.replace` with `$&` (a common pattern for keeping the
  // matched substring) would be silently corrupted in the generated JS, with
  // the placeholder UUID leaking into the running browser code.
  placeholders.forEach((placeholder, i) => {
    json = json.replace(`"${placeholder}"`, () => serializeFunction(fns[i]));
  });

  return `let options = ${json};`;
}
