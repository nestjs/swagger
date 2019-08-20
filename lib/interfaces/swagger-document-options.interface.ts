export interface SwaggerDocumentOptions {
  include?: Function[];
  /** if `true`, swagger will also load routes from the modules imported by `include` modules */
  deepScanRoutes?: boolean;
}
