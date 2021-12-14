
export interface SwaggerUIOptions {
  /**
   * Default clientId.
   *
   * @type {string}
   * @memberof SwaggerUIOptions
   */
  clientId?: string;

  /**
   * Default clientSecret.
   * 
   * 🚨 Never use this parameter in your production environment. It exposes cruicial security information. This feature is intended for dev/test environments only. 🚨
   * 
   * @type {string}
   * @memberof SwaggerUIOptions
   */
  clientSecret?: string;

  /**
   * Realm query parameter (for OAuth1) added to `authorizationUrl` and `tokenUrl`.
   *
   * @type {string}
   * @memberof SwaggerUIOptions
   */
  realm?: string;

  /**
   * Application name, displayed in authorization popup.
   *
   * @type {string}
   * @memberof SwaggerUIOptions
   */
  appName?: string;

  /**
   * Scope separator for passing scopes, encoded before calling, default value is a space (encoded value `%20`).
   *
   * @type {string}
   * @memberof SwaggerUIOptions
   */
  scopeSeparator?: string;

  /**
   * String array or scope separator (i.e. space) separated string of initially selected OAuth scopes.
   * 
   * Default is empty array
   *
   * @type {string[]}
   * @memberof SwaggerUIOptions
   */
  scopes?: string[];

  /**
   * Additional query parameters added to `authorizationUrl` and `tokenUrl`.
   *
   * @type {Record<string, any>}
   * @memberof SwaggerUIOptions
   */
  additionalQueryStringParams?: Record<string, any>;

  /**
   * Only activated for the `accessCode` flow. During the `authorization_code` request to the `tokenUrl`, pass the [Client Password](https://tools.ietf.org/html/rfc6749#section-2.3.1) using the HTTP Basic Authentication scheme (`Authorization` header with `Basic base64encode(client_id + client_secret)`).
   * 
   * The default is `false`
   *
   * @type {boolean}
   * @memberof SwaggerUIOptions
   */
  useBasicAuthenticationWithAccessCodeGrant?: boolean;

  /**
   * Only applies to `authorizatonCode` flows. [Proof Key for Code Exchange](https://tools.ietf.org/html/rfc7636) brings enhanced security for OAuth public clients. 
   * 
   * The default is `false`
   *
   * @type {boolean}
   * @memberof SwaggerUIOptions
   */
  usePkceWithAuthorizationCodeGrant?: boolean;
}