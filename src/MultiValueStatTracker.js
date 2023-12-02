import { StatTracker } from './StatTracker';

class MultiValueStatTracker {
  constructor(historySize) {
    this.historySize = historySize;
    this.trackers = {};
  }

  set(propertyName, value) {
    if (!this.trackers[propertyName]) {
      this.trackers[propertyName] = new StatTracker(this.historySize);
    }
    this.trackers[propertyName].set(value);
  }

  get(propertyName) {
    if (this.trackers[propertyName]) {
      return this.trackers[propertyName].get();
    }

    return {
      mean: NaN,
      standardDeviation: NaN,
      zScore: NaN,
    };
  }

  // Override index operation for getting values
  get [Symbol.toPrimitive]() {
    return this.get();
  }

  // Override index operation for setting values
  set [Symbol.toPrimitive](value) {
    this.set(value);
  }
}

export { MultiValueStatTracker };
