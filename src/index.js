const main = async () => {
  console.log("Main function started");
  const audioContext = new AudioContext();
  console.log("Audio context created");
  await audioContext.resume();
  console.log("Audio context resumed");
  // chrome's devtools caches the audio worklet, so we need to add a timestamp to the url
  const timestamp = Date.now();
  await audioContext.audioWorklet.addModule(`/src/analyzers/energy.js?timestamp=${timestamp}`);
  console.log("Audio worklet added");
  const meydaAudio = new AudioWorkletNode(audioContext, 'audio-energy');
  meydaAudio.port.onmessage = (event) => {
    console.log(event.data);
  };
  meydaAudio.port.postMessage("echo");
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const sourceNode = audioContext.createMediaStreamSource(stream);

  // Connect the microphone to the worklet, and the worklet to the context's destination
  sourceNode.connect(meydaAudio).connect(audioContext.destination);
  document.querySelector('h1').remove();
  // Remove event listeners if no longer needed
  document.onclick = null;
  document.ontouchstart = null;
  document.onkeydown = null;
}
document.onclick = main;
document.onkeydown = main;
document.ontouchstart = main;
