export class AudioProcessor {
  constructor(audioContext, sourceNode) {
    this.audioContext = audioContext;
    this.sourceNode = sourceNode;
    }
  async start() {
    const { audioContext, sourceNode } = this;
    // chrome's devtools caches the audio worklet, so we need to add a timestamp to the url
    const timestamp = Date.now();
    await audioContext.audioWorklet.addModule(`/src/analyzers/energy.js?timestamp=${timestamp}`);
    console.log("Audio worklet added");
    const meydaAudio = new AudioWorkletNode(audioContext, 'audio-energy');
    meydaAudio.port.onmessage = (event) => {
      console.log(event.data);
    };
    meydaAudio.port.postMessage("echo");


    // Connect the microphone to the worklet, and the worklet to the context's destination
    sourceNode.connect(meydaAudio).connect(audioContext.destination);
  }
}
