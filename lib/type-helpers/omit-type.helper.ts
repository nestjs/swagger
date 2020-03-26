import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';
import { ApiProperty } from '../decorators';
import { ModelPropertiesAccessor } from '../services/model-properties-accessor';

const modelPropertiesAccessor = new ModelPropertiesAccessor();

export function OmitType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: K[]
): Type<Omit<T, typeof keys[number]>> {
  const fields = modelPropertiesAccessor
    .getModelProperties(classRef.prototype)
    .filter(item => !keys.includes(item as K));

  abstract class OmitTypeClass {}

  fields.forEach(key => {
    const metadata = Reflect.getMetadata(
      DECORATORS.API_MODEL_PROPERTIES,
      classRef.prototype,
      key
    );
    ApiProperty(metadata)(OmitTypeClass.prototype, key);
  });
  return OmitTypeClass as Type<Omit<T, typeof keys[number]>>;
}
