import { ApiResponseMetadata, ApiResponseSchemaHost } from '../decorators';
export declare class ResponseObjectMapper {
    private readonly mimetypeContentWrapper;
    toArrayRefObject(response: Record<string, any>, name: string, produces: string[]): {
        content: import("../interfaces/open-api-spec.interface").ContentObject;
    };
    toRefObject(response: Record<string, any>, name: string, produces: string[]): {
        content: import("../interfaces/open-api-spec.interface").ContentObject;
    };
    wrapSchemaWithContent(response: ApiResponseSchemaHost & ApiResponseMetadata, produces: string[]): (ApiResponseSchemaHost & import("../decorators").ApiResponseCommonMetadata & {
        example?: any;
    }) | (ApiResponseSchemaHost & import("../decorators").ApiResponseCommonMetadata & {
        examples?: {
            [key: string]: import("../decorators").ApiResponseExamples;
        };
    }) | {
        content: import("../interfaces/open-api-spec.interface").ContentObject;
        schema?: import("../interfaces/open-api-spec.interface").SchemaObject & Partial<import("../interfaces/open-api-spec.interface").ReferenceObject>;
        status?: number | "default" | "1XX" | "2XX" | "3XX" | "4XX" | "5XX";
        description?: string;
        headers?: import("../interfaces/open-api-spec.interface").HeadersObject;
        links?: import("../interfaces/open-api-spec.interface").LinksObject;
        type?: import("@nestjs/common").Type<unknown> | Function | [Function] | string;
        isArray?: boolean;
        example?: any;
    } | {
        content: import("../interfaces/open-api-spec.interface").ContentObject;
        schema?: import("../interfaces/open-api-spec.interface").SchemaObject & Partial<import("../interfaces/open-api-spec.interface").ReferenceObject>;
        status?: number | "default" | "1XX" | "2XX" | "3XX" | "4XX" | "5XX";
        description?: string;
        headers?: import("../interfaces/open-api-spec.interface").HeadersObject;
        links?: import("../interfaces/open-api-spec.interface").LinksObject;
        type?: import("@nestjs/common").Type<unknown> | Function | [Function] | string;
        isArray?: boolean;
        examples?: {
            [key: string]: import("../decorators").ApiResponseExamples;
        };
    };
}
