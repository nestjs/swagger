import { INestApplication } from '@nestjs/common';
import {
  SwaggerBaseConfig,
  SwaggerDocument,
  SwaggerCustomOptions
} from './interfaces';
export declare class SwaggerModule {
  private static readonly swaggerScanner;
  static createDocument(
    app: INestApplication,
    config: SwaggerBaseConfig
  ): SwaggerDocument;
  static setup(
    path: string,
    app: INestApplication,
    document: SwaggerDocument,
    options?: SwaggerCustomOptions
  ): void;
}
