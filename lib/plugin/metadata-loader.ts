import { METADATA_FACTORY_NAME } from './plugin-constants';

export class MetadataLoader {
  load(metadata: Record<string, any>) {
    const pkgMetadata = metadata['@nestjs/swagger'];
    if (!pkgMetadata) {
      return;
    }
    const { models, controllers } = pkgMetadata;
    if (models) {
      this.applyMetadata(models);
    }
    if (controllers) {
      this.applyMetadata(controllers);
    }
  }

  private applyMetadata(meta: Record<string, any>) {
    meta.forEach(([fileRef, fileMeta]) => {
      Object.keys(fileMeta).forEach((key) => {
        const clsRef = fileRef[key];
        clsRef[METADATA_FACTORY_NAME] = () => fileMeta[key];
      });
    });
  }
}
