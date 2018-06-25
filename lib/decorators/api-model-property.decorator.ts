import { DECORATORS } from '../constants';
import { SwaggerEnumType } from '../types/swagger-enum.type';
import { createPropertyDecorator } from './helpers';

export const ApiModelProperty = (
  metadata: {
    description?: string;
    required?: boolean;
    type?: any;
    isArray?: boolean;
    collectionFormat?: string;
    default?: any;
    enum?: SwaggerEnumType;
    format?: string;
    in?: string;
    multipleOf?: number;
    maximum?: number;
    exclusiveMaximum?: number;
    minimum?: number;
    exclusiveMinimum?: number;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    maxProperties?: number;
    minProperties?: number;
    readOnly?: boolean;
    xml?: any;
    example?: any;
  } = {}
): PropertyDecorator => {
  return createPropertyDecorator(DECORATORS.API_MODEL_PROPERTIES, metadata);
};

export const ApiModelPropertyOptional = (
  metadata: {
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
    exclusiveMaximum?: number;
    minimum?: number;
    exclusiveMinimum?: number;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    maxProperties?: number;
    minProperties?: number;
    readOnly?: boolean;
    xml?: any;
    example?: any;
  } = {}
): PropertyDecorator =>
  ApiModelProperty({
    ...metadata,
    required: false
  });
