export declare const ApiModelProperty: (
  metadata?: {
    description?: string;
    required?: boolean;
    type?: any;
    isArray?: boolean;
    default?: any;
    enum?: string[] | number[] | (string | number)[];
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
    default?: any;
    enum?: string[] | number[] | (string | number)[];
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
