import {
  OpenAPIObject,
  OperationObject,
  ResponsesObject
} from './open-api-spec.interface.js';

export interface DenormalizedDoc extends Partial<OpenAPIObject> {
  root?: {
    method: string;
    path: string;
    /**
     * When true, this operation is emitted under `document.webhooks` instead of `document.paths`.
     */
    isWebhook?: boolean;
    /**
     * Webhook key under `document.webhooks`.
     * If omitted, a default name will be derived from the handler.
     */
    webhookName?: string;
    /**
     * Webhook key of an unnamed webhook (class and method name) used when
     * another handler's webhook has the same `webhookName`.
     */
    qualifiedWebhookName?: string;
  } & OperationObject;
  responses?: ResponsesObject;
}
