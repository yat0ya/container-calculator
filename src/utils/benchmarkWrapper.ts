export function benchmark<T>(fn: () => T): { result: T; timeMs: number } {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return { result, timeMs: end - start };
}
