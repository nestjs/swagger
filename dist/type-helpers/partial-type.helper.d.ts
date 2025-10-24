import { Type } from '@nestjs/common';
export declare function PartialType<T>(classRef: Type<T>, options?: {
    skipNullProperties?: boolean;
}): Type<Partial<T>>;
