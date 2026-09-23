export function isOasVersionAtLeast(
  openApiVersion: string,
  minMajor: number,
  minMinor: number
): boolean {
  const [major, minor] = openApiVersion.split('.').map((part) => Number(part));
  const safeMajor = Number.isNaN(major) ? 0 : major;
  const safeMinor = Number.isNaN(minor) ? 0 : minor;

  return (
    safeMajor > minMajor || (safeMajor === minMajor && safeMinor >= minMinor)
  );
}
