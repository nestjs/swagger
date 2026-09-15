import { Script } from 'node:vm';
import { OpenAPIObject } from '../../lib/interfaces';
import {
  buildSwaggerHTML,
  buildSwaggerInitJS
} from '../../lib/swagger-ui/swagger-ui';

describe('buildSwaggerHTML', () => {
  it('inserts the custom site title verbatim', () => {
    const html = buildSwaggerHTML('/', {
      customSiteTitle: 'My API Docs'
    });

    expect(html).toContain('<title>My API Docs</title>');
  });

  it('preserves "$" replacement-pattern characters in customSiteTitle', () => {
    const title = 'Cost $$ & $& Dashboard $1';
    const html = buildSwaggerHTML('/', {
      customSiteTitle: title
    });

    expect(html).toContain(`<title>${title}</title>`);
  });

  it('preserves "$" replacement-pattern characters in customCss', () => {
    const css = '.price::after { content: "$$$ $& $1 $`" }';
    const html = buildSwaggerHTML('/', {
      customCss: css
    });

    expect(html).toContain(css);
  });

  it('preserves "$" replacement-pattern characters in inline customJsStr', () => {
    const js = 'console.log("$$ $& $\' total")';
    const html = buildSwaggerHTML('/', {
      customJsStr: js
    });

    expect(html).toContain(`<script>${js}</script>`);
  });

  it('preserves "$" replacement-pattern characters in customfavIcon url', () => {
    const favIcon = 'https://example.com/icon.png?v=$$$&a=$1';
    const html = buildSwaggerHTML('/', {
      customfavIcon: favIcon
    });

    expect(html).toContain(`<link rel='icon' href='${favIcon}' />`);
  });
});

describe('buildSwaggerInitJS', () => {
  it('inserts OpenAPI descriptions with "$" replacement-pattern characters verbatim', () => {
    const description = "Must match `^[a-z][a-z0-9_]{1,63}$` plus $& $' $1 $$";
    const swaggerDoc: OpenAPIObject = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            responses: {
              '200': {
                description
              }
            }
          }
        }
      }
    };

    const script = buildSwaggerInitJS(swaggerDoc);

    expect(script).toContain(JSON.stringify(description));
    expect(() => new Script(script)).not.toThrow();
    expect(script.match(/window\.onload/g)).toHaveLength(1);
  });
});
