import { Type } from '@nestjs/common';
export declare const exploreGlobalApiSecurityMetadata: (metatype: Type<unknown>) => {
    security: any;
};
export declare const exploreApiSecurityMetadata: (instance: object, prototype: Type<unknown>, method: object) => any;
