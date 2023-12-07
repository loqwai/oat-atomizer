class SpectralFlux extends AudioWorkletProcessor {
  constructor() {
    super();
    this.previousSignal = null;
  }

  calculateSpectralFlux(signal, previousSignal, bufferSize) {
    if (!previousSignal) {
      return 0; // No previous signal to compare against
    }

    let sf = 0;
    for (let i = 0; i < signal.length; i++) {
      let x = Math.abs(signal[i]) - Math.abs(previousSignal[i]);
      sf += (x + Math.abs(x)) / 2;
    }

    return sf;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (input && input.length > 0) {
      const signal = input[0];
      const bufferSize = signal.length;

      // Calculate spectral flux
      const spectralFlux = this.calculateSpectralFlux(signal, this.previousSignal, bufferSize);

      // Store current signal for next process call
      this.previousSignal = new Float32Array(signal);

      // Example of sending spectral flux back to main thread
      this.port.postMessage(spectralFlux);

      // Pass-through audio (or implement other processing)
      output.forEach(channel => channel.set(signal));
    }

    return true;
  }
}

registerProcessor('audio-spectral-flux', SpectralFlux);
