/**
 * Wraps an async initializer so that concurrent calls share one attempt,
 * a success is remembered, and a failure is reported via `onError` and
 * leaves the next call free to retry.
 */
export function createRetryableInit(
  init: () => Promise<void>,
  onError: (error: unknown) => void
): () => Promise<void> {
  let initialized = false;
  let pending: Promise<void> | null = null;

  return () => {
    if (initialized) return Promise.resolve();
    if (!pending) {
      pending = init().then(
        () => {
          initialized = true;
        },
        (error: unknown) => {
          pending = null;
          onError(error);
        }
      );
    }
    return pending;
  };
}
