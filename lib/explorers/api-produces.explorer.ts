import { DECORATORS } from '../constants';
import { isUndefined } from '@nestjs/common/utils/shared.utils';

const defaultProduces = 'application/json';

export const exploreGlobalApiProducesMetadata = (metatype) => {
    const produces = Reflect.getMetadata(DECORATORS.API_PRODUCES, metatype);
    return produces ? { produces } : {
        produces: [defaultProduces],
    };
};

export const exploreApiProducesMetadata = (instance, prototype, method) => {
    return Reflect.getMetadata(DECORATORS.API_PRODUCES, method) || [defaultProduces];
};