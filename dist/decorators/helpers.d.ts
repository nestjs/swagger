export declare function createMethodDecorator<T = any>(metakey: string, metadata: T, { overrideExisting }?: {
    overrideExisting: boolean;
}): MethodDecorator;
export declare function createClassDecorator<T extends Array<any> = any>(metakey: string, metadata?: T): ClassDecorator;
export declare function createPropertyDecorator<T extends Record<string, any> = any>(metakey: string, metadata: T, overrideExisting?: boolean): PropertyDecorator;
export declare function createMixedDecorator<T = any>(metakey: string, metadata: T): MethodDecorator & ClassDecorator;
export declare function createParamDecorator<T extends Record<string, any> = any>(metadata: T, initial: Partial<T>): MethodDecorator & ClassDecorator;
export declare function getTypeIsArrayTuple(input: Function | [Function] | undefined | string | Record<string, any>, isArrayFlag: boolean): [Function | undefined, boolean];
