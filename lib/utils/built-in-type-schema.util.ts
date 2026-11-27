import isFunction from 'es-toolkit/compat/isFunction';
import { SchemaObject } from '../interfaces/open-api-spec.interface.js';
import { SwaggerTypesMapper } from '../services/swagger-types-mapper.js';
import { isBuiltInType, isPrimitiveTypeName } from './is-built-in-type.util.js';
import { isDateCtor } from './is-date-ctor.util.js';

const swaggerTypesMapper = new SwaggerTypesMapper();

/**
 * Whether a type is documented inline (see `getBuiltInTypeSchema`) rather
 * than as a reference to a model.
 */
export function isScalarType(type: unknown): boolean {
  return (
    isBuiltInType(type as Function) ||
    isPrimitiveTypeName(type) ||
    isDateCtor(type as Function) ||
    type === BigInt
  );
}

export function getBuiltInTypeSchema(type: Function | string): SchemaObject {
  if (isDateCtor(type)) {
    return { type: 'string', format: 'date-time' };
  }
  if (type === BigInt) {
    return { type: 'integer', format: 'int64' };
  }
  const typeName = isFunction(type) ? type.name : type;
  return { type: swaggerTypesMapper.mapTypeToOpenAPIType(typeName) };
}
