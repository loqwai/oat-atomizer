import { createRealTimeBpmProcessor, getBiquadFilters } from 'realtime-bpm-analyzer'
export class AudioData {
  constructor(audio, fftSize = 2048) {
    this.fftSize = fftSize;
    this.context = new AudioContext();
    this.analyser = this.context.createAnalyser();
    this.loudnesses = new Array(60 * 5).fill(0);
    this.peaks = new Array(10).fill(0);
    this.audio = audio;
  }

  start = async () => {
    const audioInput = this.audio ? this.context.createMediaElementSource(this.audio) : this.context.createMediaStreamSource(await navigator.mediaDevices.getUserMedia({ audio: true, video: false }));
    this.analyser.fftSize = this.fftSize;
    audioInput.connect(this.analyser);

    const realtimeAnalyzerNode = await createRealTimeBpmProcessor(this.context, );
    // const {lowpass, highpass} = getBiquadFilters(this.context);
    const gain = this.context.createGain();
    gain.gain.value = 3;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    // console.log({realtimeAnalyzerNode, lowpass, highpass})
    audioInput.connect(gain).connect(filter).connect(realtimeAnalyzerNode)
    // audioInput.connect(this.context.destination);

    realtimeAnalyzerNode.port.onmessage = (event) => {
      if (event.data.message === 'BPM') {
        // console.log('BPM', event.data.result);
      }
      if (event.data.message === 'BPM_STABLE') {
        console.log('BPM_STABLE', event.data.result);
      }
    };

    realtimeAnalyzerNode.port.postMessage({
      message: 'ASYNC_CONFIGURATION',
      parameters: {
        continuousAnalysis: true,
        stabilizationTime: 20_000, // Default value is 20_000ms after what the library will automatically delete all collected data and restart analysing BPM
      }
    })

    requestAnimationFrame(this.trackAverageLoudness);
    requestAnimationFrame(this.trackPeaks);
  }

  trackAverageLoudness = () => {
    const frequencyData = this.getFrequencyData();
    this.loudnesses.shift();
    this.loudnesses.push(frequencyData.reduce((a, b) => a + b) / frequencyData.length);
    requestAnimationFrame(this.trackAverageLoudness);
  }

  getLoudness = () => {
    const frequencyData = this.getFrequencyData();
    return frequencyData.reduce((a, b) => a + b) / frequencyData.length;
  }

  trackPeaks = () => {
    const loudness = this.getLoudness();
    // find p99 loudness value without sorting the whole array
    // const loudnessP95 = this.loudnesses.slice().sort((a, b) => a - b)[Math.floor(this.loudnesses.length * 0.50)];
    const loudnessP95 = 0;

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
    if (averagePeakTime > 1000) {
      return 2;
    }

    // convert to beats per minute
    const bpm = 60 * 1000 / averagePeakTime;
    console.log('bpm', bpm)
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
