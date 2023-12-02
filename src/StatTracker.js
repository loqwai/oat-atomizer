class StatTracker {
  constructor(historySize) {
    this.historySize = historySize;
    this.values = [];
    this.mean = NaN;
    this.standardDeviation = NaN;
    this.zScore = NaN;
  }

  set(value) {
    if (typeof value === 'number') {
      this.values.push(value);

      if (this.values.length > this.historySize) {
        this.values.shift();
      }

      this.calculateMeanAndStandardDeviation();
    }
  }

  get() {
    return {
      mean: this.mean,
      standardDeviation: this.standardDeviation,
      zScore: this.zScore,
    };
  }

  calculateMeanAndStandardDeviation() {
    if (this.values.length === 0) {
      this.mean = NaN;
      this.standardDeviation = NaN;
      this.zScore = NaN;
      return;
    }

    const sum = this.values.reduce((acc, value) => acc + value, 0);
    this.mean = sum / this.values.length;

    const squaredDifferences = this.values.map((value) => (value - this.mean) ** 2);
    const sumSquaredDifferences = squaredDifferences.reduce((acc, value) => acc + value, 0);
    this.standardDeviation = Math.sqrt(sumSquaredDifferences / this.values.length);

    const lastValue = this.values[this.values.length - 1];
    this.zScore = Math.abs((lastValue - this.mean) / this.standardDeviation);
  }
}

export { StatTracker };
