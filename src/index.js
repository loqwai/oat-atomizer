import { AudioData } from './AudioData.js';
import { Gold } from './Gold/Gold.js';

const calcTurnRate = (mean) => 0.01 + (1 - (mean / 128))
const calcVelocityMultiplier = (mean) => 0.01 + (mean / 128)
const calcSporeSize = (mean) => 1 + (5 * mean / 128)

/**
 * Map AudioData parameters to SlimeMold parameters
 * @param {AudioData} audioData
 * @param {ShaderToy} gold
 */
const adjustParameters = (audioData, gold) => {
  const waveform = audioData.getFrequencyData();
  const mean = waveform.reduce((a, b) => a + b, 0) / waveform.length;

  // slimeMold.setSporeSize(calcSporeSize(mean));
  // slimeMold.setTurnRate(calcTurnRate(mean));
  // slimeMold.setVelocityMultiplier(calcVelocityMultiplier(mean));

  requestAnimationFrame(() => adjustParameters(audioData, gold));
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
  const gold = new Gold(canvas, audioData);
  await gold.start();

  requestAnimationFrame(() => adjustParameters(audioData, gold));
}


document.onclick = main
document.ontouchstart = main
// main();
