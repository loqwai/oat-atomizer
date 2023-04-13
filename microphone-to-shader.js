/**
 * visualizer
 * @param {AnalyserNode} analyser
 */
function visualizer(analyser) {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  analyser.getByteTimeDomainData(dataArray);

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



  // // Get the current amplitude of the microphone
  // var micLevel = mic.getLevel();
  // // Map the amplitude to a value between 0 and 1
  // micLevel = map(micLevel, 0, 1, 0, 1);
  // // Send the value to the shader
  // shader.setUniform("micLevel", micLevel);
}

async function getMicrophoneStream() {
  let stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  return stream;
}

function drawMicToCanvas(canvasNode) {

}

micToShader();
//https://mdn.github.io/webaudio-examples/voice-change-o-matic/
//https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API
