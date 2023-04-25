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
  document.onkeydown = null;


  document.querySelector('h1').remove();
  const audio = document.querySelector('audio');
  const audioData = new AudioData();
  await audioData.start();

  const canvas = document.querySelector('#visualizer');
  const analyzer = document.querySelector('#analyzer');

  // const slimeMold = new SlimeMold(canvas);
  // slimeMold.start();
  const gold = new Gold(canvas, audioData);
  await gold.start();
  window.gold = gold;

  document.onclick = () => gold.startTime = performance.now();
  document.onkeydown = () => gold.startTime = performance.now();

  requestAnimationFrame(() => adjustParameters(audioData, gold));

  const drawLoudness = () => {
    /** @type CanvasRenderingContext2D */
    const ctx = analyzer.getContext('2d');
    ctx.clearRect(0, 0, analyzer.width, analyzer.height);

    // ctx.fillStyle = 'white';
    audioData.loudnesses.forEach((loudness, i) => {
      const x = i / audioData.loudnesses.length * analyzer.width;
      const height = loudness / 256 * analyzer.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(x, analyzer.height, 1, -height);
      // console.log({loudness, height})
    })
    // ctx.fillStyle = 'black';
    // ctx.fillRect(0, 0, analyzer.width, analyzer.height);
    // ctx.fillStyle = 'white';
    // ctx.fillRect(0, 0, mean, 10);
    requestAnimationFrame(drawLoudness);
  }
  drawLoudness();
}


document.onclick = main
document.onkeydown = main
document.ontouchstart = main
// main();
