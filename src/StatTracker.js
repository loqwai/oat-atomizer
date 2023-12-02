class StatTracker {
  constructor(historySize) {
    this.historySize = historySize;
    this.values = [];
    this.mean = -1;
    this.standardDeviation = -1;
    this.zScore = -1;
  }

  set(value) {
    if (typeof value !== 'number') throw new Error('StatTracker can only track numbers');
    this.values.push(value);

    if (this.values.length > this.historySize) {
      this.values.shift();
    }

    this.calculateMeanAndStandardDeviation();
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
      this.mean = -1;
      this.standardDeviation = -1;
      this.zScore = -1;
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
