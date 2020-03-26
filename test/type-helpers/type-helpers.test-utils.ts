import { getFromContainer, MetadataStorage } from 'class-validator';

export function getValidationMetadataByTarget(target: Function) {
  const metadataStorage = getFromContainer(MetadataStorage);
  const targetMetadata = metadataStorage.getTargetValidationMetadatas(
    target,
    null
  );
  return targetMetadata;
}
