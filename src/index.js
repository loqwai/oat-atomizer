import {AudioProcessor} from './AudioProcessor.js';
const main = async () => {
  console.log("Main function started");
  const audioContext = new AudioContext();
  console.log("Audio context created");
  await audioContext.resume();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const sourceNode = audioContext.createMediaStreamSource(stream);
  const audioProcessor = new AudioProcessor(audioContext, sourceNode);
  await audioProcessor.start();
  document.querySelector('h1').remove();
  // Remove event listeners if no longer needed
  document.onclick = null;
  document.ontouchstart = null;
  document.onkeydown = null;
}
document.onclick = main;
document.onkeydown = main;
document.ontouchstart = main;
