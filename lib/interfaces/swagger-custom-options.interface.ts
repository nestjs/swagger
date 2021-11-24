interface CommonSwaggerCustomOptions {
  useGlobalPrefix?: boolean;
}

/**
 * Check out all available `swagger-ui` options here:
 * {@link https://github.com/swagger-api/swagger-ui/blob/master/docs/usage/configuration.md}
 */
export interface SwaggerConfigurationOptions {
  /**
   * If set to true, enables deep linking for tags and operations.
   * @link https://swagger.io/docs/open-source-tools/swagger-ui/usage/deep-linking/
   */
  deepLinking?: boolean;

  /**
   * Controls the display of operationId in operations list. The default is `false`.
   */
  displayOperationId?: boolean;

  /**
   * The default expansion depth for models (set to -1 completely hide the models).
   */
  defaultModelsExpandDepth?: number;

  /**
   * The default expansion depth for the model on the model-example section.
   */
  defaultModelExpandDepth?: number;

  /**
   * Controls how the model is shown when the API is first rendered.
   * (The user can always switch the rendering for a given model by clicking the 'Model' and 'Example Value' links.)
   */
  defaultModelRendering?: 'example' | 'model';

  /**
   * Controls the display of the request duration (in milliseconds) for "Try it out" requests.
   */
  displayRequestDuration?: boolean;

  /**
   * Apply a sort to the operation list of each API.
   *
   * It can be `alpha` (sort by paths alphanumerically), `method` (sort by HTTP method) or a function (see `Array.prototype.sort()` to know how sort function works).
   * Default is the order returned by the server unchanged.
   */
  operationsSorter?: 'alpha' | 'method' | ((a: any, b: any) => number);

  /**
   * Controls the display of vendor extension (x-) fields and values for Operations, Parameters, Responses, and Schema.
   */
  showExtensions?: boolean;

  /**
   * Controls the display of extensions (`pattern, maxLength, minLength, maximum, minimum`) fields and values for Parameters.
   */
  showCommonExtensions?: boolean;

  /**
   * Apply a sort to the tag list of each API.
   *
   * It can be `alpha` (sort by paths alphanumerically) or a function (see `Array.prototype.sort()` to learn how to write a sort function).
   * Two tag name strings are passed to the sorter for each pass.
   * Default is the order determined by Swagger UI.
   */
  tagsSorter?: 'alpha' | ((a: any, b: any) => number);

  /**
   * When enabled, sanitizer will leave `style`, `class` and `data-*` attributes untouched on all HTML Elements declared inside markdown strings.
   * This parameter is Deprecated and will be removed in `4.0.0`.
   */
  useUnsafeMarkdown?: boolean;

  /**
   * Set to `false` to deactivate syntax highlighting of payloads and cURL command, can be otherwise an object with the `activate` and `theme` properties.
   */
  syntaxHighlight?:
    | false
    | {
        /**
         * Whether syntax highlighting should be activated or not.
         */
        activate: boolean;
        /**
         * Highlight.js syntax coloring theme to use. (Only these 6 styles are available.)
         */
        theme:
          | 'agate'
          | 'arta'
          | 'monokai'
          | 'nord'
          | 'obsidian'
          | 'tomorrow-night';
      };

  /**
   * Controls whether the "Try it out" section should be enabled by default.
   */
  tryItOutEnabled?: boolean;

  /**
   * If set, enables filtering.
   *
   * The top bar will show an edit box that you can use to filter the tagged operations that are shown.
   * Can be Boolean to enable or disable, or a string, in which case filtering will be enabled using that string as the filter expression.
   * Filtering is case sensitive matching the filter expression anywhere inside the tag.
   */
  filter?: false | String;
  /**
   * If set to `true`, it persists authorization data and it would not be lost on browser close/refresh
   */
  persistAuthorization?: boolean;

  [key: string]: any;
}

export interface ExpressSwaggerCustomOptions
  extends CommonSwaggerCustomOptions {
  explorer?: boolean;
  swaggerOptions?: SwaggerConfigurationOptions;
  customCss?: string;
  customCssUrl?: string;
  customJs?: string;
  customfavIcon?: string;
  swaggerUrl?: string;
  customSiteTitle?: string;
  validatorUrl?: string;
  url?: string;
  urls?: Record<'url' | 'name', string>[];
}

export interface FastifySwaggerCustomOptions
  extends CommonSwaggerCustomOptions {
  uiConfig?: Partial<{
    deepLinking: boolean;
    displayOperationId: boolean;
    defaultModelsExpandDepth: number;
    defaultModelExpandDepth: number;
    defaultModelRendering: string;
    displayRequestDuration: boolean;
    docExpansion: string;
    filter: boolean | string;
    layout: string;
    maxDisplayedTags: number;
    showExtensions: boolean;
    showCommonExtensions: boolean;
    useUnsafeMarkdown: boolean;
    syntaxHighlight:
      | {
          activate?: boolean;
          theme?: string;
        }
      | false;
    tryItOutEnabled: boolean;
    validatorUrl: string | null;
    persistAuthorization: boolean;
  }>;
  initOAuth?: Record<string, any>;
  staticCSP?: boolean | string | Record<string, string | string[]>;
  transformStaticCSP?: (header: string) => string;
}

export type SwaggerCustomOptions =
  | FastifySwaggerCustomOptions
  | ExpressSwaggerCustomOptions;
