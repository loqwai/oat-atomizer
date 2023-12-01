import { AudioData } from './AudioData.js';
import { ShaderToy } from './ShaderToy.js';

const main = async () => {
  document.onclick = null;
  document.ontouchstart = null;
  document.onkeydown = null;


  document.querySelector('h1').remove();
  const audioData = new AudioData();

  const canvas = document.querySelector('#visualizer');
  const params = new URLSearchParams(window.location.search);
  const shader = params.get("shader");
  const initialImageUrl = params.get("image");
  if(!shader){
    throw new Error("No shader specified");
  }

  const viz = new ShaderToy(canvas, audioData, shader, initialImageUrl);
  await viz.init();
  viz.start();
  document.onclick = () => viz.startTime = performance.now();
  document.onkeydown = () => viz.startTime = performance.now();
}


document.onclick = main
document.onkeydown = main
document.ontouchstart = main
// main();
