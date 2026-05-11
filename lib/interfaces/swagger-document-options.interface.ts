export type OperationIdFactory = (
  controllerKey: string,
  methodKey: string,
  version?: string
) => string;

/**
 * @publicApi
 */
export interface SwaggerDocumentOptions {
  /**
   * List of modules to include in the specification
   */
  include?: Function[];

  /**
   * Additional, extra models that should be inspected and included in the specification
   */
  extraModels?: Function[];

  /**
   * If `true`, swagger will ignore the global prefix set through `setGlobalPrefix()` method
   */
  ignoreGlobalPrefix?: boolean;

  /**
   * If `true`, swagger will also load routes from the modules imported by `include` modules
   */
  deepScanRoutes?: boolean;

  /**
   * Custom operationIdFactory that will be used to generate the `operationId`
   * based on the `controllerKey`, `methodKey`, and version.
   * @default () => controllerKey_methodKey_version
   */
  operationIdFactory?: OperationIdFactory;

  /**
   * Custom linkNameFactory that will be used to generate the name of links
   * in the `links` field of responses
   *
   * @see [Link objects](https://swagger.io/docs/specification/links/)
   *
   * @default () => `${controllerKey}_${methodKey}_from_${fieldKey}`
   */
  linkNameFactory?: (
    controllerKey: string,
    methodKey: string,
    fieldKey: string
  ) => string;

  /*
   * Generate tags automatically based on the controller name.
   * If `false`, you must use the `@ApiTags()` decorator to define tags.
   * Otherwise, the controller name without the suffix `Controller` will be used.
   * @default true
   */
  autoTagControllers?: boolean;

  /**
   * If `true`, swagger will only include routes that are decorated with the `@ApiIncludeEndpoint()` decorator
   * @default false
   */
  onlyIncludeDecoratedEndpoints?: boolean;
  /**
   * When `true`, any `default` value on a schema property that is a non-plain
   * object at runtime (e.g. `new Date()`, class instances) will be omitted from
   * the generated document. This prevents the spec from changing on every server
   * restart when dynamic initializers like `createdAt = new Date()` are used.
   * @default false
   */
  excludeDynamicDefaults?: boolean;

  /**
   * When set, generated `example` and `examples` values on component schemas are
   * truncated once their nested object/array depth exceeds this number. Useful
   * when DTOs hold user-supplied `@ApiProperty({ example })` payloads or
   * plugin-synthesized TSDoc `@example` metadata that inflates the document.
   * Truncation only affects example values; schema graphs (`$ref`s,
   * `properties`, `items`) are not modified. `0` collapses every non-primitive
   * example to `{}`/`[]`. `undefined` (the default) leaves examples untouched.
   *
   * Per-property `@ApiProperty({ exampleMaxDepth })` overrides this value for
   * a single schema entry without affecting siblings or children.
   *
   * @default undefined
   */
  exampleMaxDepth?: number;
}
