import { OpenAPIObject } from './index.js';

export type ModuleRoute = Omit<OpenAPIObject, 'openapi' | 'info'> &
  Record<'root', any>;
