export const createCatDtoAlt2Text = `
import { CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

export abstract class Audit {
  /** test on createdAt */
  @CreateDateColumn()
  createdAt;

  // commentedOutProperty: string;

  // test on updatedAt1
  // test on updatedAt2
  @UpdateDateColumn()
  updatedAt;

  /**
   * test
   * version 
   * @example '123'
   * @memberof Audit
   */
  @VersionColumn()
  version: string

  /**
   * testVersion
   *  
   * @example '0.0.1'
   * @example '0.0.2'
   * @memberof Audit
   */
  testVersion;

  /**
   * testBoolean
   *  
   * @example true
   */
  testBoolean: boolean;

  /**
   * testNumber
   *  
   * @example 1.0
   * @example 5
   */
  testNumber: number;
}
`;

export const createCatDtoTextAlt2Transpiled = `import { CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';
export class Audit {
    static _OPENAPI_METADATA_FACTORY() {
        return { createdAt: { required: true, type: () => Object, description: "test on createdAt" }, updatedAt: { required: true, type: () => Object }, version: { required: true, type: () => String, description: "test\\nversion", example: "123" }, testVersion: { required: true, type: () => Object, description: "testVersion", examples: ["0.0.1", "0.0.2"] }, testBoolean: { required: true, type: () => Boolean, description: "testBoolean", example: true }, testNumber: { required: true, type: () => Number, description: "testNumber", examples: [1, 5] } };
    }
}
__decorate([
    CreateDateColumn()
], Audit.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn()
], Audit.prototype, "updatedAt", void 0);
__decorate([
    VersionColumn()
], Audit.prototype, "version", void 0);
`;
