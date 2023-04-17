export class AudioData {
  constructor(fftSize = 2048) {
    this.fftSize = fftSize;
    this.context = new AudioContext();
    this.analyser = this.context.createAnalyser();
  }

  start = async () => {
    let stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const audioInput = this.context.createMediaStreamSource(stream);
    this.analyser.fftSize = this.fftSize;
    audioInput.connect(this.analyser);
  }

  /**
   * @returns {Uint8Array}
   */
  getFrequencyData = () => {
    const size = this.analyser.fftSize / 2;
    const frequencyData = new Uint8Array(size);
    this.analyser.getByteFrequencyData(frequencyData);
    return frequencyData
  }

  /**
   * @returns {Uint8Array}
   */
  getWaveform = () => {
    const waveform = new Uint8Array(this.analyser.fftSize);
    analyser.getByteTimeDomainData(waveform)
    return waveform;
  }
}