import { SwaggerEnumType } from '../types/swagger-enum.type';
export declare const ApiModelProperty: (
  metadata?: {
    description?: string;
    required?: boolean;
    type?: any;
    isArray?: boolean;
    collectionFormat?: string;
    default?: any;
    enum?: SwaggerEnumType;
    format?: string;
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
  }
) => PropertyDecorator;
export declare const ApiModelPropertyOptional: (
  metadata?: {
    description?: string;
    type?: any;
    isArray?: boolean;
    collectionFormat?: string;
    default?: any;
    enum?: SwaggerEnumType;
    format?: string;
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
  }
) => PropertyDecorator;
