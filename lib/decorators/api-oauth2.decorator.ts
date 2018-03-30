import { DECORATORS } from '../constants';
import { createMixedDecorator } from './helpers';

export const ApiOAuth2Auth = (scopes?: string[]) => {
  return createMixedDecorator(DECORATORS.API_OAUTH2, scopes ? scopes : []);
};
