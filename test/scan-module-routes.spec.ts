import { SwaggerScanner } from '../dist/swagger-scanner';

describe('SwaggerScanner guard', () => {
  it('should return empty array when routes is undefined', () => {
    const scanner: any = new (require('../dist/swagger-scanner').SwaggerScanner)(null, null, null);
    expect(() => scanner.scanModuleRoutes(undefined, null, null, null, null)).not.toThrow();
    expect(scanner.scanModuleRoutes(undefined, null, null, null, null)).toEqual([]);
  });
});
