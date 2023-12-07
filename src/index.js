const main = async () => {
  console.log("Main function started");
  const audioContext = new AudioContext();
  console.log("Audio context created");
  await audioContext.resume();
  console.log("Audio context resumed");
  await audioContext.audioWorklet.addModule('/src/MeydaAudioWorklet.js');
  console.log("Audio worklet added");
  const simpleNode = new AudioWorkletNode(audioContext, 'simple-processor');
  document.querySelector('h1').remove();
  // Remove event listeners if no longer needed
  document.onclick = null;
  document.ontouchstart = null;
  document.onkeydown = null;
}
document.onclick = main;
document.onkeydown = main;
document.ontouchstart = main;
