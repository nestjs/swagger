import { Type } from '@nestjs/common';
export declare const exploreGlobalApiTagsMetadata: (autoTagControllers?: boolean) => (metatype: Type<unknown>) => {
    tags: any;
};
export declare const exploreApiTagsMetadata: (instance: object, prototype: Type<unknown>, method: object) => any;
