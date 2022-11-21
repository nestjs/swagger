import { ParameterObject } from '../interfaces/open-api-spec.interface';

export class GlobalParameterStorageHost {
  private parameters = new Array<ParameterObject>();

  addGlobalParameters(...parameter: ParameterObject[]) {
    this.parameters.push(...parameter);
  }

  getGlobalParameters() {
    return this.parameters;
  }

  cleanGlobalParamters() {
    this.parameters = [];
  }
}

const globalRef = global as any;
export const GlobalParameterStorage: GlobalParameterStorageHost =
  globalRef.SwaggerGlobalParameterStorage ||
  (globalRef.SwaggerGlobalParameterStorage = new GlobalParameterStorageHost());
