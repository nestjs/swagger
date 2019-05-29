import { SwaggerScheme } from '../interfaces/swagger-base-config.interface';

export const buildDocumentBase = () => ({
  swagger: '2.0',
  info: {
    description: '',
    version: '1.0.0',
    title: ''
  },
  basePath: '/',
  tags: [],
  schemes: ['http'] as SwaggerScheme[]
});
