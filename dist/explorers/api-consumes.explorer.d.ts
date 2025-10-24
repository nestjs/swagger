import { Type } from '@nestjs/common';
export declare const exploreGlobalApiConsumesMetadata: (metatype: Type<unknown>) => {
    consumes: any;
};
export declare const exploreApiConsumesMetadata: (instance: object, prototype: Type<unknown>, method: object) => string[] | undefined;
