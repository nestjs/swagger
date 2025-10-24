export interface PluginOptions {
    dtoFileNameSuffix?: string | string[];
    controllerFileNameSuffix?: string | string[];
    classValidatorShim?: boolean;
    classTransformerShim?: boolean | 'exclusive';
    dtoKeyOfComment?: string;
    controllerKeyOfComment?: string;
    introspectComments?: boolean;
    esmCompatible?: boolean;
    readonly?: boolean;
    pathToSource?: string;
    debug?: boolean;
    parameterProperties?: boolean;
    skipAutoHttpCode?: boolean;
    skipDefaultValues?: boolean;
}
export declare const mergePluginOptions: (options?: Record<string, any>) => PluginOptions;
