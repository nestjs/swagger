import { Controller } from '@nestjs/common/interfaces';
import { ApplicationConfig } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { OperationIdFactory } from './interfaces';
import { DenormalizedDoc } from './interfaces/denormalized-doc.interface';
import { SchemaObject } from './interfaces/open-api-spec.interface';
import { SchemaObjectFactory } from './services/schema-object-factory';
export declare class SwaggerExplorer {
    private readonly schemaObjectFactory;
    private readonly options;
    private readonly mimetypeContentWrapper;
    private readonly metadataScanner;
    private readonly schemas;
    private operationIdFactory;
    private routePathFactory?;
    private linkNameFactory;
    constructor(schemaObjectFactory: SchemaObjectFactory, options?: {
        httpAdapterType?: string;
    });
    exploreController(wrapper: InstanceWrapper<Controller>, applicationConfig: ApplicationConfig, options: {
        modulePath?: string;
        globalPrefix?: string;
        operationIdFactory?: OperationIdFactory;
        linkNameFactory?: (controllerKey: string, methodKey: string, fieldKey: string) => string;
        autoTagControllers?: boolean;
        onlyIncludeDecoratedEndpoints?: boolean;
    }): DenormalizedDoc[];
    getSchemas(): Record<string, SchemaObject>;
    private generateDenormalizedDocument;
    private exploreGlobalMetadata;
    private exploreRoutePathAndMethod;
    private getOperationId;
    private getRoutePathVersions;
    private reflectControllerPath;
    private validateRoutePath;
    private mergeMetadata;
    private deepMergeMetadata;
    private mergeValues;
    private migrateOperationSchema;
    private registerExtraModels;
    private getVersionMetadata;
}
