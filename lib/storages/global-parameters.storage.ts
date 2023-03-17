import { ParameterObject } from '../interfaces/open-api-spec.interface';

export class GlobalParametersStorageHost {
  private parameters = new Array<ParameterObject>();

  add(...parameters: ParameterObject[]) {
    this.parameters.push(...parameters);
  }

  getAll() {
    return this.parameters;
  }

  clear() {
    this.parameters = [];
  }
}

const globalRef = global as any;
export const GlobalParametersStorage: GlobalParametersStorageHost =
  globalRef.SwaggerGlobalParametersStorage ||
  (globalRef.SwaggerGlobalParametersStorage =
    new GlobalParametersStorageHost());
