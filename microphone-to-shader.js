//	The sound is input as a 512x2 texture with the bottom layer being the wave form where the brightness corrosponds
//	with the amplitude of the sample and the top layer being a frequency spectrum of the underlying sine wave
//	frequencies where brightness is the amplitude of the wave and each line represents average of 23 hz frequencies.
//	The texture is single channel red so the texture, when drawn, is red.
/**
 * visualizer
 * @param {AnalyserNode} analyser
 */
function analyserToTexture(analyser) {
  const size = analyser.fftSize / 2;
  const frequencyData = new Uint8Array(size);
  analyser.getByteFrequencyData(frequencyData);

  const waveform = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(waveform)
  const subwave = waveform.subarray(size, waveform.length);


  const audioData = new Uint8Array(frequencyData.length + subwave.length);
  audioData.set(frequencyData);
  audioData.set(subwave, frequencyData.length);

  window.audioData = audioData;
  window.frequencyData = frequencyData;
  window.waveform = waveform;

  requestAnimationFrame(() => analyserToTexture(analyser));
}

async function micToTexture() {
  const stream = await getMicrophoneStream();

  const audioContext = new AudioContext();
  const audioInput = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  audioInput.connect(analyser);

  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);

  requestAnimationFrame(() => analyserToTexture(analyser));
  // requestAnimationFrame(() => equalizer(analyser));
}

async function getMicrophoneStream() {
  let stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  return stream;
}

micToTexture();
//https://mdn.github.io/webaudio-examples/voice-change-o-matic/
//https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API
