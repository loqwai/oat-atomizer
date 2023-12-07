// simple-processor.js
class MeydaAudioWorklet extends AudioWorkletProcessor {
  constructor() {
      super();
      // importScripts('https://cdn.jsdelivr.net/npm/meyda/dist/meyda.min.js');
    this.port.onmessage = (event) => {
      this.port.postMessage("Echo from worklet: " + event.data);
    }
  }
  process(inputs, outputs) {
    this.port.postMessage('processing audio');
      return true;
  }
}

registerProcessor('meyda-audio', MeydaAudioWorklet);
