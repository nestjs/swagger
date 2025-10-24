import { Type } from '@nestjs/common';
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
type ClassRefsToConstructors<T extends Type[]> = {
    [U in keyof T]: T[U] extends Type<infer V> ? V : never;
};
type Intersection<T extends Type[]> = Type<UnionToIntersection<ClassRefsToConstructors<T>[number]>>;
export declare function IntersectionType<T extends Type[]>(...classRefs: T): Intersection<T>;
export {};
