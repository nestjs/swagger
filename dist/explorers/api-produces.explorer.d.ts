import { Type } from '@nestjs/common';
export declare const exploreGlobalApiProducesMetadata: (metatype: Type<unknown>) => {
    produces: any;
};
export declare const exploreApiProducesMetadata: (instance: object, prototype: Type<unknown>, method: object) => any;
