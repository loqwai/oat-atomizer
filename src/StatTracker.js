class OptimizedStatTracker {
  constructor(historySize) {
    this.historySize = historySize;
    this.queue = []; // To keep the last 'historySize' values
    this.runningSum = 0;
    this.runningSumOfSquares = 0;
    this.mean = -1;
    this.standardDeviation = -1;
    this.min = Infinity;
    this.max = -Infinity;
  }

  set(value) {
    if (typeof value !== 'number') throw new Error('StatTracker can only track numbers');

    // Update min and max
    this.min = Math.min(this.min, value);
    this.max = Math.max(this.max, value);

    // Add new value
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

    // Recalculate mean and standard deviation
    this.mean = this.runningSum / this.queue.length;
    const meanSquare = this.mean * this.mean;
    const meanOfSquares = this.runningSumOfSquares / this.queue.length;
    this.standardDeviation = Math.sqrt(meanOfSquares - meanSquare);
  }

  get() {
    return {
      mean: this.mean || -1,
      standardDeviation: this.standardDeviation || -1,
      min: this.min === Infinity ? -1 : this.min,
      max: this.max === -Infinity ? -1 : this.max,
    };
  }

  recalculateMinMax() {
    this.min = Math.min(...this.queue);
    this.max = Math.max(...this.queue);
  }
}

export { OptimizedStatTracker as StatTracker };
