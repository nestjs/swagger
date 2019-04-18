import {
  OAuth2ImplicitSecurity,
  ApiKeySecurity,
  BasicSecurity
} from './interfaces';

export const DECORATORS_PREFIX = 'swagger';
export const DECORATORS = {
  API_OPERATION: `${DECORATORS_PREFIX}/apiOperation`,
  API_RESPONSE: `${DECORATORS_PREFIX}/apiResponse`,
  API_PRODUCES: `${DECORATORS_PREFIX}/apiProduces`,
  API_CONSUMES: `${DECORATORS_PREFIX}/apiConsumes`,
  API_USE_TAGS: `${DECORATORS_PREFIX}/apiUseTags`,
  API_PARAMETERS: `${DECORATORS_PREFIX}/apiParameters`,
  API_MODEL_PROPERTIES: `${DECORATORS_PREFIX}/apiModelProperties`,
  API_MODEL_PROPERTIES_ARRAY: `${DECORATORS_PREFIX}/apiModelPropertiesArray`,
  API_EXCLUDE_ENDPOINT: `${DECORATORS_PREFIX}/apiExcludeEndpoint`,
  API_SECURITY: `${DECORATORS_PREFIX}/apiSecurity`
};

export const DEFAULT_BASIC_SECURITY: BasicSecurity = {
  type: 'basic',
  description: 'Auto generate SecurityDefinitions'
};

export const DEFAULT_APIKEY_SECURITY: ApiKeySecurity = {
  type: 'apiKey',
  description: 'Auto generate SecurityDefinitions',
  name: 'access_token',
  in: 'query'
};

export const DEFAULT_OAUTH2_SECURITY: OAuth2ImplicitSecurity = {
  type: 'oauth2',
  description: 'Auto generate SecurityDefinitions',
  flow: 'implicit',
  authorizationUrl: 'http://localhost:9000/oauth2',
  scopes: {}
};
