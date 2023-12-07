// simple-processor.js
class EnergyAnalyzer extends AudioWorkletProcessor {
  constructor() {
      super();
    this.port.onmessage = (event) => {
      this.port.postMessage(this.energy);
    }
  }
  process(inputs, outputs) {
    let energy = 0;
    // for all inputs
    for (let input of inputs) {
      // for all channels
      for (let channel of input) {
        // for all samples
        for (let sample of channel) {
          energy += Math.pow(Math.abs(sample), 2);
        }
      }
    }
    this.energy = energy;
    this.port.postMessage(this.energy);
    return true;
  }
}

registerProcessor('audio-energy', EnergyAnalyzer);
