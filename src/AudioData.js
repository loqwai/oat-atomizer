export class AudioData {
  constructor(fftSize = 2048) {
    this.fftSize = fftSize;
    this.context = new AudioContext();
    this.analyser = this.context.createAnalyser();
    this.loudnesses = new Array(60 * 5).fill(0);
    this.peaks = new Array(10).fill(0);
  }

  start = async () => {
    let stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const audioInput = this.context.createMediaStreamSource(stream);
    this.analyser.fftSize = this.fftSize;
    audioInput.connect(this.analyser);

    requestAnimationFrame(this.trackAverageLoudness);
    requestAnimationFrame(this.trackPeaks);
  }

  trackAverageLoudness = () => {
    const frequencyData = this.getFrequencyData();
    this.loudnesses.shift();
    this.loudnesses.push(frequencyData.reduce((a, b) => a + b) / frequencyData.length);
    requestAnimationFrame(this.trackAverageLoudness);
  }

  trackPeaks = () => {
    const frequencyData = this.getFrequencyData();
    const loudness = frequencyData.reduce((a, b) => a + b) / frequencyData.length;
    const loudnessP95 = this.loudnesses.sort()[Math.floor(this.loudnesses.length * 0.75)];

    if (loudness > loudnessP95) {
      this.peaks.shift();
      this.peaks.push(performance.now());
    }

    requestAnimationFrame(this.trackPeaks);
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

  getBPM = () => {
    // console.log(this.peaks)
    // find the time between peaks
    const peakTimes = [];
    for (let i = 1; i < this.peaks.length; i++) {
      peakTimes.push(this.peaks[i] - this.peaks[i - 1]);
    }
    // find the average time between peaks
    const averagePeakTime = peakTimes.reduce((a, b) => a + b) / peakTimes.length;
    console.log('bpm', bpm)
    if (averagePeakTime > 1000) {
      return 2;
    }

    // convert to beats per minute
    const bpm = 60 * 1000 / averagePeakTime;
    return bpm;
  }

  getPeaks = (waveform) => {
    const peaks = [];
    const length = waveform.length;
    for (let i = 0; i < length;) {
      if (waveform[i] > 0) {
        peaks.push(i);
        // Skip forward ~ 1/4s to get past this peak.
        i += 10000;
      }
      i++;
    }
    return peaks;
  }

  /**
   * @returns {Uint8Array}
   */
  getWaveform = () => {
    const waveform = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(waveform)
    return waveform;
  }
}