export function ApiHideProperty(): PropertyDecorator {
  return () => (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {};
}
