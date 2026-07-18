import { EpochMismatchError } from "../errors.js";

export class NavigationEpochClock {
  #epoch = 0;

  get current(): number {
    return this.#epoch;
  }

  /** Call on route / major SPA view transitions. */
  bump(): number {
    this.#epoch += 1;
    return this.#epoch;
  }

  assertExpected(expected: number | undefined): void {
    if (expected === undefined) return;
    if (expected !== this.#epoch) {
      throw new EpochMismatchError(expected, this.#epoch);
    }
  }
}
