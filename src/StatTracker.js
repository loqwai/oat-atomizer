class StatTracker {
  constructor(historySize) {
    this.historySize = historySize;
    this.values = [];
    this.mean = -1;
    this.standardDeviation = -1;
    this.zScore = -1;
    this.min = Infinity;
    this.max = -Infinity;
  }

  set(value) {
    if (typeof value !== 'number') throw new Error('StatTracker can only track numbers');
    this.values.push(value);

    if (this.values.length > this.historySize) {
      const removedValue = this.values.shift();
      if (removedValue === this.min) {
        // Recalculate min if the removed value was the minimum
        this.min = Math.min(...this.values);
      }
      if (removedValue === this.max) {
        // Recalculate max if the removed value was the maximum
        this.max = Math.max(...this.values);
      }
    } else {
      // Initialize min and max if history is not yet full
      this.min = Math.min(this.min, value);
      this.max = Math.max(this.max, value);
    }

    this.calculateMeanAndStandardDeviation();
  }

  get() {
    return {
      mean: this.mean || -1,
      standardDeviation: this.standardDeviation || -1,
      zScore: this.zScore || -1,
      min: this.min == Infinity ? -1 : this.min,
      max: this.max == -Infinity ? -1 : this.max,
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


class OptimizedStatTracker {
  constructor(historySize) {
    this.historySize = historySize;
    this.queue = []; // To keep the last 'historySize' values
    this.runningSum = 0;
    this.runningSumOfSquares = 0;
    this.mean = -1;
    this.standardDeviation = -1;
    this.zScore = -1;
    this.min = Infinity;
    this.max = -Infinity;
  }

  set(value) {
    if (typeof value !== 'number') throw new Error('StatTracker can only track numbers');

    // Update min and max
    this.min = Math.min(this.min, value);
    this.max = Math.max(this.max, value);

    // Add new value and update running sums
    this.queue.push(value);
    this.runningSum += value;
    this.runningSumOfSquares += value * value;

    // Remove oldest value if necessary
    if (this.queue.length > this.historySize) {
      const removedValue = this.queue.shift();
      this.runningSum -= removedValue;
      this.runningSumOfSquares -= removedValue * removedValue;

      // Check if we need to update min or max
      if (removedValue === this.min || removedValue === this.max) {
        this.recalculateMinMax();
      }
    }

    // Recalculate mean, standard deviation, and z-score
    this.mean = this.runningSum / this.queue.length;
    const meanSquare = this.mean * this.mean;
    const meanOfSquares = this.runningSumOfSquares / this.queue.length;
    this.standardDeviation = Math.sqrt(meanOfSquares - meanSquare);

    const lastValue = this.queue[this.queue.length - 1];
    this.zScore = (lastValue - this.mean) / (this.standardDeviation || 1);
  }

  get() {
    return {
      mean: this.mean || -1,
      standardDeviation: this.standardDeviation || -1,
      zScore: this.zScore || -1,
      min: this.min === Infinity ? -1 : this.min,
      max: this.max === -Infinity ? -1 : this.max,
    };
  }

  recalculateMinMax() {
    this.min = Math.min(...this.queue);
    this.max = Math.max(...this.queue);
  }
}

export { StatTracker};
