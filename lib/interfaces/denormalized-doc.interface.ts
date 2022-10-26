import { VersioningType } from '@nestjs/common';
import {
  OpenAPIObject,
  OperationObject,
  ResponsesObject
} from './open-api-spec.interface';

export interface DenormalizedDoc extends Partial<OpenAPIObject> {
  root?: {
    method: string;
    path: string;
    version: string;
    versionType: VersioningType;
  } & OperationObject;
  responses?: ResponsesObject;
}
