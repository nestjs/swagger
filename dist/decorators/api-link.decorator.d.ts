import { Type } from '@nestjs/common';
export interface ApiLinkOptions {
    from: Type<unknown> | Function;
    fromField?: string;
    routeParam: string;
}
export declare function ApiLink({ from, fromField, routeParam }: ApiLinkOptions): MethodDecorator;
