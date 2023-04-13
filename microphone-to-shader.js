const canvas = document.querySelector('#equalizer');
const canvasCtx = canvas.getContext('2d');
const WIDTH = canvas.clientWidth;
const HEIGHT = canvas.clientHeight;

/**
 * visualizer
 * @param {AnalyserNode} analyser
 */
function visualizer(analyser) {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  analyser.getByteTimeDomainData(dataArray);


  canvasCtx.fillStyle = 'rgb(200, 200, 200)';
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

  requestAnimationFrame(() => visualizer(analyser));
}

async function micToShader() {
  const stream = await getMicrophoneStream();

  const audioContext = new AudioContext();
  const audioInput = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  audioInput.connect(analyser);

  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);



  requestAnimationFrame(() => visualizer(analyser));
}

async function getMicrophoneStream() {
  let stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  return stream;
}

micToShader();
//https://mdn.github.io/webaudio-examples/voice-change-o-matic/
//https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API
