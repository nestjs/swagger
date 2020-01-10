export function ApiHideProperty() {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {};
}
