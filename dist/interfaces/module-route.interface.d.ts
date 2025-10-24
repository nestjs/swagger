import { OpenAPIObject } from '.';
export type ModuleRoute = Omit<OpenAPIObject, 'openapi' | 'info'> & Record<'root', any>;
