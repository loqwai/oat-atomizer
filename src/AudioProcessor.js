import { calculateSpectralSpread } from './calculateSpectralSpread.js';
export class AudioProcessor {
  // An array of strings of names of processors
  processors = [
    'Energy',
    'SpectralFlux',
  ];

  constructor(audioContext, sourceNode, fftSize = 2048) {
    this.audioContext = audioContext;
    this.sourceNode = sourceNode;
    this.fftSize = fftSize;
    this.features = {};

    this.fftAnalyzer = this.audioContext.createAnalyser();
    this.fftAnalyzer.fftSize = this.fftSize;  // Example size, can be adjusted
    this.fftData = new Uint8Array(this.fftAnalyzer.frequencyBinCount);
    // this.fftFloatData = new Float32Array(this.fftAnalyzer.frequencyBinCount);
    this.sourceNode.connect(this.fftAnalyzer);
    // Don't connect the fftAnalyzer to the audioContext's destination
  }

  start = async () => {
    const timestamp = Date.now();
    for (const processor of this.processors) {
      await this.audioContext.audioWorklet.addModule(`/src/analyzers/${processor}.js?timestamp=${timestamp}`);
      console.log(`Audio worklet ${processor} added`);
      const audioProcessor = new AudioWorkletNode(this.audioContext, `Audio-${processor}`);
      this.sourceNode.connect(audioProcessor);
      // Don't connect the audioProcessor to the audioContext's destination
      audioProcessor.port.onmessage = event => this.features[processor] = event.data;
    }
    this.pullFFTData();
    this.calculateSpectralFeatures();
  }

  setupFFT = () => {
    this.fftData = new Uint8Array(this.fftAnalyzer.frequencyBinCount);
  }

  pullFFTData = () => {
    // this.fftAnalyzer.getByteTimeDomainData(this.fftData);
    this.fftAnalyzer.getByteFrequencyData(this.fftData);
    // this.fftAnalyzer.getFloatFrequencyData(this.fftFloatData);
    requestAnimationFrame(this.pullFFTData);
  }
  // Inside AudioProcessor class
  calculateSpectralFeatures = () => {
    const spectralSpread = calculateSpectralSpread(this.fftData, this.audioContext.sampleRate, this.fftSize);
    console.log(spectralSpread);
    requestAnimationFrame(this.calculateSpectralFeatures);
  }

}
