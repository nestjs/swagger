export declare const ApiImplicitHeader: (
  metadata: {
    name: string;
    description?: string;
    required?: boolean;
  }
) => MethodDecorator;
export declare const ApiImplicitHeaders: (
  headers: {
    name: string;
    description?: string;
    required?: boolean;
  }[]
) => MethodDecorator;
