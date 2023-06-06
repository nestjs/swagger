import { METADATA_FACTORY_NAME } from './plugin-constants';

export class MetadataLoader {
  async load(metadata: Record<string, any>) {
    const pkgMetadata = metadata['@nestjs/swagger'];
    if (!pkgMetadata) {
      return;
    }
    const { models, controllers } = pkgMetadata;
    if (models) {
      await this.applyMetadata(models);
    }
    if (controllers) {
      await this.applyMetadata(controllers);
    }
  }

  private async applyMetadata(meta: Record<string, any>) {
    const loadPromises = meta.map(async ([fileImport, fileMeta]) => {
      const fileRef = await fileImport;
      Object.keys(fileMeta).map((key) => {
        const clsRef = fileRef[key];
        clsRef[METADATA_FACTORY_NAME] = () => fileMeta[key];
      });
    });
    await Promise.all(loadPromises);
  }
}
