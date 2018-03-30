import { SwaggerDocument } from './interfaces';
export declare class SwaggerScanner {
  private readonly explorer;
  private readonly transfomer;
  scanApplication(app: any): SwaggerDocument;
  scanModuleRoutes(routes: any): SwaggerDocument;
}
