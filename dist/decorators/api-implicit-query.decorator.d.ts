export declare const ApiImplicitQuery: (
  metadata: {
    name: string;
    description?: string;
    required?: boolean;
    type?: any;
    isArray?: boolean;
    collectionFormat?: 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi';
  }
) => MethodDecorator;
