export class PendingActionGuard {
  private inFlight: Promise<unknown> | null = null;

  run<T>(action: () => Promise<T>): Promise<T> | null {
    if (this.inFlight) {
      return null;
    }

    const task = action().finally(() => {
      this.inFlight = null;
    });

    this.inFlight = task;

    return task;
  }
}
