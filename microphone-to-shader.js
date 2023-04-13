const canvas = document.querySelector('#equalizer');
const shaderCanvas = document.querySelector('#shader-canvas');
/**
 * @type {CanvasRenderingContext2D}
 */
const canvasCtx = canvas.getContext('2d');
const WIDTH = canvas.offsetWidth;
const HEIGHT = canvas.offsetHeight;

/**
 * visualizer
 * @param {AnalyserNode} analyser
 */
function equalizer(analyser) {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  analyser.getByteTimeDomainData(dataArray);


  canvasCtx.fillStyle = 'rgb(255, 165, 0)';
  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
  canvasCtx.lineWidth = 2;
  canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
  canvasCtx.beginPath();

  const sliceWidth = WIDTH / bufferLength;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const y = v * HEIGHT / 2;

    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  canvasCtx.lineTo(WIDTH, HEIGHT / 2);
  canvasCtx.stroke();
  // get the image data from the canvas
  // window.imageData = canvasCtx.getImageData(0, 0, WIDTH, HEIGHT);

  requestAnimationFrame(() => equalizer(analyser));
}

//	The sound is input as a 512x2 texture with the bottom layer being the wave form where the brightness corrosponds
//	with the amplitude of the sample and the top layer being a frequency spectrum of the underlying sine wave
//	frequencies where brightness is the amplitude of the wave and each line represents average of 23 hz frequencies.
//	The texture is single channel red so the texture, when drawn, is red.
/**
 * visualizer
 * @param {AnalyserNode} analyser
 */
function analyserToTexture(analyser) {
  const frequencyData = new Float32Array(512);
  analyser.getFloatFrequencyData(frequencyData);
  for (let i = 0; i < frequencyData.length; i++) {
    frequencyData[i] = Math.abs(frequencyData[i] / 256.0);
  }

  window.frequencyData = frequencyData;

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
}

async function getMicrophoneStream() {
  let stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  return stream;
}

micToTexture();
//https://mdn.github.io/webaudio-examples/voice-change-o-matic/
//https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API
