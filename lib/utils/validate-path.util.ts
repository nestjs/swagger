export const validatePath = (inputPath: string): string =>
  inputPath?.charAt(0) !== '/' ? '/' + inputPath : inputPath;
