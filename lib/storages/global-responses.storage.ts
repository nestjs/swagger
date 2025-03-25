import { ApiResponseOptions } from '../decorators';

type GlobalResponesMap = Record<string, Omit<ApiResponseOptions, 'status'>>;

export class GlobalResponsesStorageHost {
  private responses: GlobalResponesMap = {};

  add(responses: GlobalResponesMap) {
    this.responses = {
      ...this.responses,
      ...responses
    };
  }

  getAll() {
    return this.responses;
  }

  clear() {
    this.responses = {};
  }
}

const globalRef = global as any;
export const GlobalResponsesStorage: GlobalResponsesStorageHost =
  globalRef.SwaggerGlobalResponsesStorage ||
  (globalRef.SwaggerGlobalResponsesStorage = new GlobalResponsesStorageHost());
