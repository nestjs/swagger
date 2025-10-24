import { Type } from '@nestjs/common';
export declare function PickType<T, K extends keyof T>(classRef: Type<T>, keys: readonly K[]): Type<Pick<T, (typeof keys)[number]>>;
