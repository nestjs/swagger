import { Type } from '@nestjs/common';
export declare function clonePluginMetadataFactory(target: Type<unknown>, parent: Type<unknown>, transformFn?: (metadata: Record<string, any>) => Record<string, any>): void;
