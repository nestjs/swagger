export type SwaggerEnumType =
  | string[]
  | number[]
  | (string | number)[]
  | Record<number, string>
  | (() => (string | number)[] | Record<string, any>);
