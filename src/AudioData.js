import * as _unused from 'meyda'

const {Meyda} = window;

const createFilter = (context, type) => {
  const filter = context.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = 100;
  return filter;
}

const getFrequencyData = (analyser) => {
  const size = analyser.fftSize / 2;
  const frequencyData = new Uint8Array(size);
  analyser.getByteFrequencyData(frequencyData);
  return frequencyData
}

export class AudioData {
  constructor(audio, fftSize = 1024) {
    this.fftSize = fftSize;
    this.context = new AudioContext();
    this.analyser = new AnalyserNode(this.context);
    this.loudnesses = new Array(60 * 5).fill(0);
    this.peaks = new Array(10).fill(0);
    this.audio = audio;

    this.filters = {
      lowpass: createFilter(this.context, 'lowpass'),
      highpass: createFilter(this.context, 'highpass'),
      mid: createFilter(this.context, 'bandpass'),
    }

    this.analysers = {
      lowpass: new AnalyserNode(this.context, { fftSize: 2048 }),
      highpass: new AnalyserNode(this.context, { fftSize: 2048 }),
      mid: new AnalyserNode(this.context, { fftSize: 2048 }),
    }

    this.loudness = {
      low: 0,
      mid: 0,
      high: 0,
      overall: 0,
    }
  }

  start = async () => {
    const audioInput = this.audio ? this.context.createMediaElementSource(this.audio) : this.context.createMediaStreamSource(await navigator.mediaDevices.getUserMedia({ audio: true, video: false }));
    this.analyser.fftSize = this.fftSize;
    audioInput.connect(this.analyser);
    audioInput.connect(this.filters.lowpass).connect(this.analysers.lowpass);;
    audioInput.connect(this.filters.highpass).connect(this.analysers.highpass);
    audioInput.connect(this.filters.mid).connect(this.analysers.mid);

    this.setupMeyda(audioInput);
    requestAnimationFrame(this.trackAverageLoudness);
    requestAnimationFrame(this.trackPeaks);
    requestAnimationFrame(this.trackFilteredLoudnesses);
  }

  setupMeyda = (audioInput) => {
    let featureList = Meyda.listAvailableFeatureExtractors();
    // remove spectralFlux from the featureList bc it crashes
    // featureList = featureList.filter(f => f !== 'spectralFlux');
    this.features = {}
    for(const feature of featureList) {
      this.features[feature] = 0;
    }
    const analyzer = Meyda.createMeydaAnalyzer({
      audioContext: this.context,
      source: audioInput,
      bufferSize: 512,
      featureExtractors: featureList,
      callback: features => {
        // console.log(features)
        this.features = {...this.features, ...features};
      }
    });

    for(const feature in this.features) {
      this.features[feature] = 0;
      console.log(feature)
    }
    analyzer.start();
  }

  trackFilteredLoudnesses = () => {
    this.loudness.low = getFrequencyData(this.analysers.lowpass).reduce((a, b) => a + b) / this.analysers.lowpass.fftSize;
    this.loudness.high = getFrequencyData(this.analysers.highpass).reduce((a, b) => a + b) / this.analysers.highpass.fftSize;
    this.loudness.mid = getFrequencyData(this.analysers.mid).reduce((a, b) => a + b) / this.analysers.mid.fftSize;

    requestAnimationFrame(this.trackFilteredLoudnesses);
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
