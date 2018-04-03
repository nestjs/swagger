export declare const createMethodDecorator: (
  metakey: any,
  metadata: any
) => MethodDecorator;
export declare const createClassDecorator: (
  metakey: any,
  metadata: any
) => ClassDecorator;
export declare const createPropertyDecorator: (
  metakey: any,
  metadata: any
) => PropertyDecorator;
export declare const createMixedDecorator: (
  metakey: any,
  metadata: any
) => (target: object, key?: any, descriptor?: any) => any;
export declare const createParamDecorator: (
  metadata: any,
  initial: any
) => (
  target: any,
  key: any,
  descriptor: PropertyDescriptor
) => PropertyDescriptor;
export declare const createMultipleParamDecorator: (
  multiMetadata: any[],
  initial: any
) => (
  target: any,
  key: any,
  descriptor: PropertyDescriptor
) => PropertyDescriptor;
