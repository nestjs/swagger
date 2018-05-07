import * as swaggerUi from 'swagger-ui-express';
import { INestApplication } from '@nestjs/common';
import {
  SwaggerBaseConfig,
  SwaggerDocument,
  SwaggerCustomOptions
} from './interfaces';
import { SwaggerScanner } from './swagger-scanner';

export class SwaggerModule {
  private static readonly swaggerScanner = new SwaggerScanner();

  public static createDocument(
    app: INestApplication,
    config: SwaggerBaseConfig
  ): SwaggerDocument {
    const document = this.swaggerScanner.scanApplication(app);
    return {
      ...config,
      ...document,
      swagger: '2.0'
    };
  }

  public static setup(
    path: string,
    app: INestApplication,
    document: SwaggerDocument,
    options?: SwaggerCustomOptions
  ) {
    const validatePath = (path): string =>
      path.charAt(0) !== '/' ? '/' + path : path;

    const finalPath = validatePath(path);
    app.use(finalPath, swaggerUi.serve, swaggerUi.setup(document, options));
    app.use(finalPath + '-json', (req, res) => res.json(document));
  }
}
