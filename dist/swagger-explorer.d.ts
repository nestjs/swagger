import { Controller } from '@nestjs/common/interfaces';
import { InstanceWrapper } from '@nestjs/core/injector/container';
export declare class SwaggerExplorer {
  private readonly metadataScanner;
  private readonly modelsDefinitions;
  exploreController({ instance, metatype }: InstanceWrapper<Controller>): any[];
  getModelsDefinitons(): any[];
  private generateDenormalizedDocument(
    metatype,
    prototype,
    instance,
    explorersSchema
  );
  private exploreGlobalMetadata(metatype);
  private exploreRoutePathAndMethod(instance, prototype, method, globalPath);
  private reflectControllerPath(metatype);
  private validateRoutePath(path);
  private mergeMetadata(globalMetadata, methodMetadata);
}
