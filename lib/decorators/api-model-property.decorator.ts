import { DECORATORS } from '../constants';
import { SwaggerEnumType } from '../types/swagger-enum.type';
import { createPropertyDecorator, getTypeIsArrayTuple } from './helpers';

export interface ApiModelPropertyOptionalMetadata {
  description?: string;
  type?: any;
  isArray?: boolean;
  collectionFormat?: string;
  default?: any;
  enum?: SwaggerEnumType;
  format?: string;
  in?: string;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: boolean;
  minimum?: number;
  exclusiveMinimum?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  readOnly?: boolean;
  nullable?: boolean;
  xml?: any;
  example?: any;
}

export interface ApiModelPropertyMetadata
  extends ApiModelPropertyOptionalMetadata {
  required?: boolean;
}

export const ApiModelProperty = (
  metadata: ApiModelPropertyMetadata = {}
): PropertyDecorator => {
  const [type, isArray] = getTypeIsArrayTuple(metadata.type, metadata.isArray);
  return createPropertyDecorator(DECORATORS.API_MODEL_PROPERTIES, {
    ...metadata,
    type,
    isArray
  });
};

export const ApiModelPropertyOptional = (
  metadata: ApiModelPropertyOptionalMetadata = {}
): PropertyDecorator =>
  ApiModelProperty({
    ...metadata,
    required: false
  });

export const ApiResponseModelProperty = (
  metadata: {
    type?: any;
    example?: any;
  } = {}
): PropertyDecorator =>
  ApiModelProperty({
    ...metadata
  });
