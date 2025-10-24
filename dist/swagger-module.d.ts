import { INestApplication } from '@nestjs/common';
import { HttpServer } from '@nestjs/common/interfaces/http/http-server.interface';
import { OpenAPIObject, SwaggerCustomOptions, SwaggerDocumentOptions } from './interfaces';
export declare class SwaggerModule {
    private static readonly metadataLoader;
    static createDocument(app: INestApplication, config: Omit<OpenAPIObject, 'paths'>, options?: SwaggerDocumentOptions): OpenAPIObject;
    static loadPluginMetadata(metadataFn: () => Promise<Record<string, any>>): Promise<void>;
    protected static serveStatic(finalPath: string, app: INestApplication, customStaticPath?: string): void;
    protected static serveDocuments(finalPath: string, urlLastSubdirectory: string, httpAdapter: HttpServer, documentOrFactory: OpenAPIObject | (() => OpenAPIObject), options: {
        ui: boolean;
        raw: boolean | Array<'json' | 'yaml'>;
        jsonDocumentUrl: string;
        yamlDocumentUrl: string;
        swaggerOptions: SwaggerCustomOptions;
    }): void;
    protected static serveSwaggerUi(finalPath: string, urlLastSubdirectory: string, httpAdapter: HttpServer, getBuiltDocument: () => OpenAPIObject, swaggerOptions: SwaggerCustomOptions): void;
    protected static serveDefinitions(httpAdapter: HttpServer, getBuiltDocument: () => OpenAPIObject, options: {
        jsonDocumentUrl: string;
        yamlDocumentUrl: string;
        swaggerOptions: SwaggerCustomOptions;
    }, serveOptions: {
        serveJson: boolean;
        serveYaml: boolean;
    }): void;
    static setup(path: string, app: INestApplication, documentOrFactory: OpenAPIObject | (() => OpenAPIObject), options?: SwaggerCustomOptions): void;
}
