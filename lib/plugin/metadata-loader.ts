import { METADATA_FACTORY_NAME } from './plugin-constants';

export class MetadataLoader {
  private static readonly refreshHooks = new Array<() => void>();

  static addRefreshHook(hook: () => void) {
    return MetadataLoader.refreshHooks.push(hook);
  }

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
    this.runHooks();
  }

  private async applyMetadata(
    meta: Array<[Promise<unknown>, Record<string, any>]>
  ) {
    const loadPromises = meta.map(async ([fileImport, fileMeta]) => {
      const fileRef = await fileImport;
      Object.keys(fileMeta).map((key) => {
        const clsRef = fileRef[key];
        clsRef[METADATA_FACTORY_NAME] = () => fileMeta[key];
      });
    });
    await Promise.all(loadPromises);
  }

  private runHooks() {
    MetadataLoader.refreshHooks.forEach((hook) => hook());
  }
}
