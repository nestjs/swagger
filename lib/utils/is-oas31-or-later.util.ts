export function isOas31OrLater(openApiVersion: string): boolean {
  const [major, minor] = openApiVersion.split('.').map((part) => Number(part));
  const safeMajor = Number.isNaN(major) ? 0 : major;
  const safeMinor = Number.isNaN(minor) ? 0 : minor;

  return safeMajor > 3 || (safeMajor === 3 && safeMinor >= 1);
}
