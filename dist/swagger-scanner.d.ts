import { INestApplication, InjectionToken } from '@nestjs/common';
import { ApplicationConfig } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { OpenAPIObject, OperationIdFactory, SwaggerDocumentOptions } from './interfaces';
import { ModuleRoute } from './interfaces/module-route.interface';
import { SchemaObject } from './interfaces/open-api-spec.interface';
export declare class SwaggerScanner {
    private readonly transformer;
    private readonly schemaObjectFactory;
    private explorer;
    scanApplication(app: INestApplication, options: SwaggerDocumentOptions): Omit<OpenAPIObject, 'openapi' | 'info'>;
    scanModuleControllers(controller: Map<InjectionToken, InstanceWrapper>, applicationConfig: ApplicationConfig, options: {
        modulePath: string | undefined;
        globalPrefix: string | undefined;
        operationIdFactory?: OperationIdFactory;
        linkNameFactory?: (controllerKey: string, methodKey: string, fieldKey: string) => string;
        autoTagControllers?: boolean;
        onlyIncludeDecoratedEndpoints?: boolean;
    }): ModuleRoute[];
    getModules(modulesContainer: Map<string, Module>, include: Function[]): Module[];
    addExtraModels(schemas: Record<string, SchemaObject>, extraModels: Function[]): void;
    private getModulePathMetadata;
    private initializeSwaggerExplorer;
}
