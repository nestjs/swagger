export const createCatDtoAlt2Text = `
import { CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

export abstract class Audit {
  @CreateDateColumn()
  createdAt;

  @UpdateDateColumn()
  updatedAt;

  @VersionColumn()
  version;
}
`;

export const createCatDtoTextAlt2Transpiled = `import { CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';
export class Audit {
    static _OPENAPI_METADATA_FACTORY() {
        return { createdAt: { required: true, type: () => Object }, updatedAt: { required: true, type: () => Object }, version: { required: true, type: () => Object } };
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
