export declare function getSchemaPath(model: string | Function): string;
export declare function refs(...models: Function[]): {
    $ref: string;
}[];
