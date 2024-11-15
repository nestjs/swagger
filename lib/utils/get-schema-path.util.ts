import { isString } from '@nestjs/common/utils/shared.utils';
import { DECORATORS } from '../constants';
import { ApiSchemaOptions } from '../decorators/api-schema.decorator';

export function getSchemaPath(model: string | Function): string {
  const modelName = isString(model) ? model : getSchemaNameByClass(model);
  return `#/components/schemas/${modelName}`;
}

function getSchemaNameByClass(target: Function): string {
  if (!target || typeof target !== 'function') {
    return '';
  }

  const customSchema: ApiSchemaOptions[] = Reflect.getOwnMetadata(
    DECORATORS.API_SCHEMA,
    target
  );

  if (!customSchema || customSchema.length === 0) {
    return target.name;
  }

  return customSchema[customSchema.length - 1].name ?? target.name;
}

export function refs(...models: Function[]) {
  return models.map((item) => ({
    $ref: getSchemaPath(item.name)
  }));
}
