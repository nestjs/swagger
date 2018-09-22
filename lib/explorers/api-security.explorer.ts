import { DECORATORS } from '../constants';
import {
  SwaggerBearerAuthOption,
  SwaggerSecurityDefinitionRules
} from '../interfaces/swagger-bearer-auth-options.interface';

export const exploreGlobalApiSecurityMetadata = metatype => {
  const bearer = Reflect.getMetadata(DECORATORS.API_BEARER, metatype);
  const oauth2 = Reflect.getMetadata(DECORATORS.API_OAUTH2, metatype);

  const security = [];
  bearer && security.push({ bearer });
  oauth2 && security.push({ oauth2 });

  return security.length > 0 ? { security } : undefined;
};

export const exploreApiSecurityMetadata = (instance, prototype, method) => {
  const bearer = Reflect.getMetadata(DECORATORS.API_BEARER, method);
  const oauth2 = Reflect.getMetadata(DECORATORS.API_OAUTH2, method);

  const security = [];
  bearer && security.push(...exploreBearerSecurityOptions(bearer.security));
  oauth2 && security.push({ oauth2 });

  return security.length > 0 ? security : undefined;
};

const exploreBearerSecurityOptions = (
  definitionOption: SwaggerBearerAuthOption,
  securityResult?: any
) => {
  securityResult = securityResult || [];

  if (!definitionOption.rule) {
    definitionOption.rule = SwaggerSecurityDefinitionRules.AND;
  }

  const definitions: string[] = definitionOption.securityDefinitions;
  switch (definitionOption.rule) {
    case SwaggerSecurityDefinitionRules.OR:
      definitions.forEach(definition => {
        securityResult.push({ [definition]: [] });
      });
      break;
    case SwaggerSecurityDefinitionRules.AND:
      securityResult.push(
        definitions.reduce((securityObj, definition) => {
          securityObj[definition] = [];
          return securityObj;
        }, {})
      );
      break;
    default:
      break;
  }

  if (definitionOption.nestedDefinitions) {
    exploreBearerSecurityOptions(
      definitionOption.nestedDefinitions,
      securityResult
    );
  }

  return securityResult;
};
