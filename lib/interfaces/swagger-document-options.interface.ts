export interface SwaggerDocumentOptions {
  include?: Function[];
  extraModels?: Function[];
  /** if `true`, swagger will also load routes from the modules imported by `include` modules */
  deepScanRoutes?: boolean;
}
