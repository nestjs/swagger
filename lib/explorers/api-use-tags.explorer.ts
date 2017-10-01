import { DECORATORS } from '../constants';
import { isUndefined } from '@nestjs/common/utils/shared.utils';

export const exploreGlobalApiUseTagsMetadata = (metatype) => {
    const tags = Reflect.getMetadata(DECORATORS.API_USE_TAGS, metatype);
    return tags ? { tags } : undefined;
};

export const exploreApiUseTagsMetadata = (metatype) => {
    return Reflect.getMetadata(DECORATORS.API_USE_TAGS, metatype);
};