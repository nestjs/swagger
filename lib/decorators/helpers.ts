import { omit, pickBy, negate, isUndefined, isNil } from 'lodash';
import { DECORATORS } from '../constants';

export const createMethodDecorator = (metakey, metadata): MethodDecorator => {
    return (target, key, descriptor: PropertyDescriptor) => {
        Reflect.defineMetadata(metakey, metadata, descriptor.value);
        return descriptor;
    };
};

export const createClassDecorator = (metakey, metadata): ClassDecorator => {
    return (target) => {
        Reflect.defineMetadata(metakey, metadata, target);
        return target;
    };
};

export const createPropertyDecorator = (metakey, metadata): PropertyDecorator => {
    return (target: object, propertyKey: string | symbol) => {
        const properties = Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES_ARRAY, target) || [];
        Reflect.defineMetadata(
            DECORATORS.API_MODEL_PROPERTIES_ARRAY,
            [...properties, `:${propertyKey}`],
            target,
        );
        Reflect.defineMetadata(metakey, {
            type: Reflect.getMetadata('design:type', target, propertyKey),
            ...metadata,
        }, target, propertyKey);
    };
};

export const createMixedDecorator = (metakey, metadata) => {
    return (target: object, key?, descriptor?) => {
        if (descriptor) {
            Reflect.defineMetadata(metakey, metadata, descriptor.value);
            return descriptor;
        }
        Reflect.defineMetadata(metakey, metadata, target);
        return target;
    };
};

export const createParamDecorator = (metadata, initial) => {
    return (target, key, descriptor: PropertyDescriptor) => {
        const parameters = Reflect.getMetadata(DECORATORS.API_PARAMETERS, descriptor.value) || [];
        Reflect.defineMetadata(DECORATORS.API_PARAMETERS, [
            ...parameters,
            {
                ...initial,
                ...pickBy(metadata, negate(isUndefined)),
            },
        ], descriptor.value);
        return descriptor;
    };
};