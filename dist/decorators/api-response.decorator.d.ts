export declare const ApiResponse: (
  metadata: {
    status: number;
    description?: string;
    type?: any;
    isArray?: boolean;
  }
) => (target: any, key?: any, descriptor?: PropertyDescriptor) => any;
