import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';
import { ApiProperty } from '../decorators';
import { ModelPropertiesAccessor } from '../services/model-properties-accessor';

const modelPropertiesAccessor = new ModelPropertiesAccessor();

export function PartialType<T>(classRef: Type<T>): Type<Partial<T>> {
  const fields = modelPropertiesAccessor.getModelProperties(classRef.prototype);

  abstract class PartialTypeClass {}

  fields.forEach(key => {
    const metadata =
      Reflect.getMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        classRef.prototype,
        key
      ) || {};

    ApiProperty({
      ...metadata,
      required: false
    })(PartialTypeClass.prototype, key);
  });

  return PartialTypeClass as Type<Partial<T>>;
}
