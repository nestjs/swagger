import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';
import { ApiProperty } from '../decorators';
import { ModelPropertiesAccessor } from '../services/model-properties-accessor';

const modelPropertiesAccessor = new ModelPropertiesAccessor();

export function PickType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: K[]
): Type<Pick<T, typeof keys[number]>> {
  const fields = modelPropertiesAccessor
    .getModelProperties(classRef.prototype)
    .filter(item => keys.includes(item as K));

  abstract class PickTypeClass {}

  fields.forEach(key => {
    const metadata = Reflect.getMetadata(
      DECORATORS.API_MODEL_PROPERTIES,
      classRef.prototype,
      key
    );
    ApiProperty(metadata)(PickTypeClass.prototype, key);
  });

  return PickTypeClass as Type<Pick<T, typeof keys[number]>>;
}
