import { INestApplication } from '@nestjs/common';
import {
  OpenAPIObject,
  SwaggerCustomOptions,
  SwaggerDocumentOptions
} from './interfaces';
import { SwaggerScanner } from './swagger-scanner';
import { assignTwoLevelsDeep } from './utils/assign-two-levels-deep';
import { getGlobalPrefix } from './utils/get-global-prefix';
import { validatePath } from './utils/validate-path.util';
import * as jsyaml from 'js-yaml';
import swaggerUi from './swagger-ui';
import * as fs from 'fs';
import * as pathNode from 'path';

export class SwaggerModule {
  public static createDocument(
    app: INestApplication,
    config: Omit<OpenAPIObject, 'paths'>,
    options: SwaggerDocumentOptions = {}
  ): OpenAPIObject {
    const swaggerScanner = new SwaggerScanner();
    const document = swaggerScanner.scanApplication(app, options);

    document.components = assignTwoLevelsDeep(
      {},
      config.components,
      document.components
    );

    return {
      openapi: '3.0.0',
      paths: {},
      ...config,
      ...document
    };
  }

  public static setup(
    path: string,
    app: INestApplication,
    document: OpenAPIObject,
    options?: SwaggerCustomOptions
  ) {
    const httpAdapter = app.getHttpAdapter();
    const globalPrefix = getGlobalPrefix(app);
    const finalPath = validatePath(
      options?.useGlobalPrefix && globalPrefix && !globalPrefix.match(/^(\/?)$/)
        ? `${globalPrefix}${validatePath(path)}`
        : path
    );

    console.log(finalPath);
    // httpAdapter.get('/test', (req, res) => {
    //   return 'test OK!';
    // });

    const yamlDocument = jsyaml.dump(document);
    const jsonDocument = JSON.stringify(document);
    const html = swaggerUi.generateHTML(finalPath, document, options);

    const swaggerUIBasePath = swaggerUi.getSwaggerUiAbsoluteFSPath();
    const swaggerUIAssetsNames = [
      'swagger-ui.css',
      'swagger-ui-bundle.js',
      'swagger-ui-standalone-preset.js'
      // 'favicon-32x32.png',
      // 'favicon-16x16.png'
    ];

    const ext2type = {
      js: 'application/javascript',
      css: 'text/css'
    };
    /*
     * in oder to avoid using static serving libraries (they are routing platform dependant)
     * swaggerUI assets are served manually
     */
    swaggerUIAssetsNames.forEach((assetName) => {
      const assetFullUrl = `${finalPath}/${assetName}`;
      const [, assetExtension] = assetName.split('.');
      const assetPath = pathNode.join(swaggerUIBasePath, assetName);

      httpAdapter.get(assetFullUrl, async (req, res) => {
        fs.readFile(assetPath, 'utf8', function (err, data) {
          if (err) {
            throw err;
          }

          res.type(ext2type[assetExtension]);
          res.send(data);
        });
      });
    });

    httpAdapter.get(`${finalPath}/swagger-ui-init.js`, (req, res) => {
      res.type('js');
      res.send(swaggerUi.getInitJs(document, options));
    });

    httpAdapter.get(finalPath, (req, res) => {
      res.type('html');
      res.send(html);
    });

    httpAdapter.get(`${finalPath}-json`, (req, res) => {
      res.type('json');
      res.send(jsonDocument);
    });

    httpAdapter.get(`${finalPath}-yaml`, (req, res) => {
      res.type('yaml');
      res.send(yamlDocument);
    });
  }
}
