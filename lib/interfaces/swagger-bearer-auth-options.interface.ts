export enum SwaggerSecurityDefinitionRules {
  AND = 'and',
  OR = 'or'
}

export interface SwaggerBearerAuthOption {
  securityDefinitions: string[];
  rule?: SwaggerSecurityDefinitionRules;
  nestedDefinitions?: SwaggerBearerAuthOption;
}
