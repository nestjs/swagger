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

  private applyMetadata(models: Record<string, any>) {
    Object.keys(models).forEach((path) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fileRef = require(path);

      Object.keys(models[path]).forEach((key) => {
        const clsRef = fileRef[key];
        clsRef[METADATA_FACTORY_NAME] = () => models[path][key];
      });
    });
  }
}
