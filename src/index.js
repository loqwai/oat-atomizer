import { AudioData } from './AudioData.js';
import { ShaderToy } from './ShaderToy.js';

const main = async () => {
  document.onclick = null;
  document.ontouchstart = null;
  document.onkeydown = null;


  document.querySelector('h1').remove();
  const audioData = new AudioData();
  await audioData.start();

  const canvas = document.querySelector('#visualizer');

  const shader = new URLSearchParams(window.location.search).get("shader");
  if(!shader){
    throw new Error("No shader specified");
  }

  const viz = new ShaderToy(canvas, 'boy');
  await viz.init();
  viz.start();
  document.onclick = () => viz.startTime = performance.now();
  document.onkeydown = () => viz.startTime = performance.now();
}


document.onclick = main
document.onkeydown = main
document.ontouchstart = main
// main();
