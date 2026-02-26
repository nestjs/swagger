import { DECORATORS } from '../constants';
import { createMethodDecorator } from './helpers';

/**
 * OpenAPI 3.1 adds top-level `webhooks`, a map of out-of-band callbacks
 * initiated by the API provider.
 *
 * This decorator marks a Nest handler as a webhook operation so it is emitted
 * under `document.webhooks` instead of `document.paths`.
 *
 * @example
 * ```ts
 * @Post('stripe')
 * @ApiWebhook('stripeEvent')
 * handleStripeEvent() {}
 * ```
 *
 * @publicApi
 */
export function ApiWebhook(name?: string): MethodDecorator {
  return createMethodDecorator(DECORATORS.API_WEBHOOK, name ?? true);
}
