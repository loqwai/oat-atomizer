export class AudioData {
  constructor(audio, fftSize = 1024) {
    this.fftSize = fftSize;
    this.audioContext = new AudioContext();
    // this.context = new AudioContext();
    // this.analyser = new AnalyserNode(this.context);
    // this.loudnesses = new Array(60 * 5).fill(0);
    // this.peaks = new Array(10).fill(0);
    // this.audio = audio;

    // this.filters = {
    //   lowpass: createFilter(this.context, 'lowpass'),
    //   highpass: createFilter(this.context, 'highpass'),
    //   mid: createFilter(this.context, 'bandpass'),
    // }

    // this.analysers = {
    //   lowpass: new AnalyserNode(this.context, { fftSize }),
    //   highpass: new AnalyserNode(this.context, { fftSize }),
    //   mid: new AnalyserNode(this.context, { fftSize }),
    // }

    // this.loudness = {
    //   low: 0,
    //   mid: 0,
    //   high: 0,
    //   overall: 0,
    // }
  }

  async createMyAudioProcessor() {
    console.log("Creating audio context");
    await this.audioContext.resume();
    await this.audioContext.audioWorklet.addModule("./MeydaAudioWorklet.js");
    console.log("Audio context created");

    return new AudioWorkletNode(this.audioContext, "meyda-audio");
  }

  start = async () => {
    await this.createMyAudioProcessor();

    // const audioInput = this.audio ? this.context.createMediaElementSource(this.audio) : this.context.createMediaStreamSource(await navigator.mediaDevices.getUserMedia({ audio: true, video: false }));
    // this.analyser.fftSize = this.fftSize;
    // audioInput.connect(this.analyser);
    // audioInput.connect(this.filters.lowpass).connect(this.analysers.lowpass);;
    // audioInput.connect(this.filters.highpass).connect(this.analysers.highpass);
    // audioInput.connect(this.filters.mid).connect(this.analysers.mid);

    // this.setupMeyda(audioInput);
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

  getLoudness = () => {
    const frequencyData = this.getFrequencyData();
    return frequencyData.reduce((a, b) => a + b) / frequencyData.length;
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
