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
   * @example 'version 123'
   * @example ignore this
   * @memberof Audit
   */
  @VersionColumn()
  version: string

  /**
   * testVersion
   *
   * @example '0.0.1'
   * @example '0.0.2'
   * @deprecated
   * @memberof Audit
   */
  testVersion;

  /**
   * testVersion2
   *
   * @example '0.0.1'
   * @example '0.0.2'
   * @deprecated Use version instead
   * @memberof Audit
   */
  testVersion2;

  /**
   * testVersionArray
   *
   * @example ['0.0.1', '0.0.2']
   * @memberof Audit
   */
  testVersionArray: string[];

  /**
   * testVersionArray
   *
   * @example ['version 123', 'version 321']
   * @memberof Audit
   */
  testVersionArray2: string[];

  /**
   * testVersionArray
   *
   * @example [123, 321]
   * @memberof Audit
   */
  testVersionArray3: number[];

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

  /**
   * privateProperty
   * @example 'secret'
   */
  #privateProperty: string;
}
`;

export const createCatDtoTextAlt2Transpiled = `var _Audit_privateProperty;
import * as openapi from "@nestjs/swagger";
import { CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';
export class Audit {
    constructor() {
        /**
         * privateProperty
         * @example 'secret'
         */
        _Audit_privateProperty.set(this, void 0);
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { createdAt: { required: true, type: () => Object, description: "test on createdAt" }, updatedAt: { required: true, type: () => Object }, version: { required: true, type: () => String, description: "test\\nversion", example: "version 123" }, testVersion: { required: true, type: () => Object, description: "testVersion", examples: ["0.0.1", "0.0.2"], deprecated: true }, testVersion2: { required: true, type: () => Object, description: "testVersion2", examples: ["0.0.1", "0.0.2"], deprecated: true }, testVersionArray: { required: true, type: () => [String], description: "testVersionArray", example: ["0.0.1", "0.0.2"] }, testVersionArray2: { required: true, type: () => [String], description: "testVersionArray", example: ["version 123", "version 321"] }, testVersionArray3: { required: true, type: () => [Number], description: "testVersionArray", example: [123, 321] }, testBoolean: { required: true, type: () => Boolean, description: "testBoolean", example: true }, testNumber: { required: true, type: () => Number, description: "testNumber", examples: [1, 5] } };
    }
}
_Audit_privateProperty = new WeakMap();
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
