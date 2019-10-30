export function getSchemaPath(modelName: string): string {
  return `#/components/schemas/${modelName}`;
}

export function refs(...models: Function[]) {
  return models.map(item => ({
    $ref: getSchemaPath(item.name)
  }));
}
