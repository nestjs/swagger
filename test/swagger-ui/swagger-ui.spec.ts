import { buildSwaggerHTML } from '../../lib/swagger-ui/swagger-ui';

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
