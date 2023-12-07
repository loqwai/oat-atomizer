// simple-processor.js
class MeydaAudioWorklet extends AudioWorkletProcessor {
  constructor() {
      super();
    this.port.onmessage = (event) => {
      this.port.postMessage("Echo from worklet: " + event.data);
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
    this.port.postMessage(energy);
      return true;
  }
}

registerProcessor('meyda-audio', MeydaAudioWorklet);
