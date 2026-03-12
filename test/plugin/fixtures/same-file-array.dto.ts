/**
 * Regression test for issue #3630
 * Same-file array types should not have async modifier added
 * https://github.com/nestjs/swagger/issues/3630
 */

export const sameFileArrayDtoText = `
export class App {
  /**
   * Name of the app.
   * @example "example-app"
   */
  public name!: string;
}

export class AppDataResult {
  /**
   * Returned rows.
   */
  public items!: App[];

  /**
   * Total count.
   * @example 100
   */
  public total!: number;
}
`;

export const sameFileArrayDtoTextTranspiled = `import * as openapi from "@nestjs/swagger";
export class App {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, title: "Name of the app.", example: "example-app" } };
    }
}
export class AppDataResult {
    static _OPENAPI_METADATA_FACTORY() {
        return { items: { required: true, type: () => [require("./same-file-array.dto").App], title: "Returned rows." }, total: { required: true, type: () => Number, title: "Total count.", example: 100 } };
    }
}
`;

// ESM version - should have async modifier because it uses await import()
export const sameFileArrayDtoTextTranspiledEsm = `import * as openapi from "@nestjs/swagger";
export class App {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, title: "Name of the app.", example: "example-app" } };
    }
}
export class AppDataResult {
    static _OPENAPI_METADATA_FACTORY() {
        return { items: { required: true, type: async () => [(await import("./same-file-array.dto.js")).App], title: "Returned rows." }, total: { required: true, type: () => Number, title: "Total count.", example: 100 } };
    }
}
`;
