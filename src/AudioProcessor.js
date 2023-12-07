const processors = [
  'Energy',
  'SpectralFlux',
];

export class AudioProcessor {
  constructor(audioContext, sourceNode) {
    this.audioContext = audioContext;
    this.sourceNode = sourceNode;
    this.features = {};
  }

  async start() {
    const { audioContext, sourceNode } = this;
    // chrome's devtools caches the audio worklet, so we need to add a timestamp to the url
    const timestamp = Date.now();
    for (const processor of processors) {
      await audioContext.audioWorklet.addModule(`/src/analyzers/${processor}.js?timestamp=${timestamp}`);
      console.log(`Audio worklet ${processor} added`);
      const audioProcessor = new AudioWorkletNode(audioContext, `Audio-${processor}`);
      sourceNode.connect(audioProcessor).connect(audioContext.destination);
      audioProcessor.port.onmessage = event => this.features[processor] = event.data;
    }
    setInterval(() => console.log(this.features), 10);
  }
}
