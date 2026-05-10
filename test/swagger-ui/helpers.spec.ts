import { buildJSInitOptions } from '../../lib/swagger-ui/helpers';

describe('buildJSInitOptions', () => {
  it('serializes a single function value into the resulting JS', () => {
    const fn = function (req: any) {
      return req;
    };
    const js = buildJSInitOptions({
      swaggerDoc: {} as any,
      swaggerUrl: undefined,
      customOptions: { requestInterceptor: fn } as any
    });

    expect(js).toContain('let options = ');
    expect(js).toContain(fn.toString());
  });

  it('preserves function bodies that contain replacement-pattern characters ($&, $1, $$)', () => {
    const interceptor = function (req: any) {
      req.url = req.url.replace(/\/api\/v1\//g, '/api/v2/$&');
      return req;
    };
    const js = buildJSInitOptions({
      swaggerDoc: {} as any,
      swaggerUrl: undefined,
      customOptions: { requestInterceptor: interceptor } as any
    });

    expect(js).toContain(interceptor.toString());
    const uuidPattern =
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    expect(js).not.toMatch(uuidPattern);
  });

  it('preserves multiple function values whose bodies contain $-patterns', () => {
    const requestInterceptor = function (req: any) {
      return req.url.replace(/foo(.*)/, 'bar$1');
    };
    const responseInterceptor = function (res: any) {
      return res.body.replace(/x/g, '$$');
    };

    const js = buildJSInitOptions({
      swaggerDoc: {} as any,
      swaggerUrl: undefined,
      customOptions: {
        requestInterceptor,
        responseInterceptor
      } as any
    });

    expect(js).toContain(requestInterceptor.toString());
    expect(js).toContain(responseInterceptor.toString());
  });
});
