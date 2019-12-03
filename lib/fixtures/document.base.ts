import { OpenAPIObject } from '../interfaces';

export const buildDocumentBase = (): Omit<OpenAPIObject, 'paths'> => ({
  openapi: '3.0.0',
  info: {
    title: '',
    description: '',
    version: '1.0.0',
    contact: {}
  },
  tags: [],
  servers: [],
  components: {}
});
