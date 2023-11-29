import { AudioData } from './AudioData.js';
import { Visualizer } from './Visualizer.js';

const main = async () => {
  document.onclick = null;
  document.ontouchstart = null;
  document.onkeydown = null;


  document.querySelector('h1').remove();
  const audioData = new AudioData();
  await audioData.start();

  const canvas = document.querySelector('#visualizer');

  // const slimeMold = new SlimeMold(canvas);
  // slimeMold.start();
  const viz = new Visualizer(canvas, audioData);
  await viz.start();
  window.gold = viz;

  document.onclick = () => viz.startTime = performance.now();
  document.onkeydown = () => viz.startTime = performance.now();
}


document.onclick = main
document.onkeydown = main
document.ontouchstart = main
// main();
