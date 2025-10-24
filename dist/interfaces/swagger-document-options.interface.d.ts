export type OperationIdFactory = (controllerKey: string, methodKey: string, version?: string) => string;
export interface SwaggerDocumentOptions {
    include?: Function[];
    extraModels?: Function[];
    ignoreGlobalPrefix?: boolean;
    deepScanRoutes?: boolean;
    operationIdFactory?: OperationIdFactory;
    linkNameFactory?: (controllerKey: string, methodKey: string, fieldKey: string) => string;
    autoTagControllers?: boolean;
    onlyIncludeDecoratedEndpoints?: boolean;
}
