import { Type } from '@nestjs/common';
import 'reflect-metadata';
export declare class ModelPropertiesAccessor {
    getModelProperties(prototype: Type<unknown>): string[];
    applyMetadataFactory(prototype: Type<unknown>): void;
}
