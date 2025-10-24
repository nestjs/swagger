import { OpenAPIObject } from './interfaces';
export declare class SwaggerTransformer {
    normalizePaths(denormalizedDoc: (Partial<OpenAPIObject> & Record<'root', any>)[]): Record<'paths', OpenAPIObject['paths']>;
}
