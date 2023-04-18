import { AudioData } from './AudioData.js';
import { SlimeMold } from 'http://cdn.jsdelivr.net/gh/loqwai/slime-molds@f267f2ef591f125914efe0c8ac404d740412fef5/src/SlimeMold.js';
import { ShaderToy } from './ShaderToy.js';

const calcTurnRate = (mean) => 0.01 + (1 - (mean / 128))
const calcVelocityMultiplier = (mean) => 0.01 + (mean / 128)
const calcSporeSize = (mean) => 1 + (5 * mean / 128)

/**
 * Map AudioData parameters to SlimeMold parameters
 * @param {AudioData} audioData
 * @param {ShaderToy} shaderToy
 */
const adjustParameters = (audioData, shaderToy) => {
  const waveform = audioData.getFrequencyData();
  const mean = waveform.reduce((a, b) => a + b, 0) / waveform.length;

  // slimeMold.setSporeSize(calcSporeSize(mean));
  // slimeMold.setTurnRate(calcTurnRate(mean));
  // slimeMold.setVelocityMultiplier(calcVelocityMultiplier(mean));

  requestAnimationFrame(() => adjustParameters(audioData, shaderToy));
}

const main = async () => {
  document.onclick = null;
  document.ontouchstart = null;
  document.querySelector('h1').remove();
  const audioData = new AudioData();
  await audioData.start();

  const canvas = document.querySelector('#visualizer');

  // const slimeMold = new SlimeMold(canvas);
  // slimeMold.start();
  const shaderToy = new ShaderToy(canvas, audioData);
  await shaderToy.start();

  requestAnimationFrame(() => adjustParameters(audioData, shaderToy));
}


document.onclick = main
document.ontouchstart = main
// main();