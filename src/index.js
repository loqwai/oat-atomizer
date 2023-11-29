import { AudioData } from './AudioData.js';
import { Visualizer } from './Visualizer.js';

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
  const viz = new Visualizer(canvas, audioData);
  await viz.start();
  window.gold = viz;

  document.onclick = () => viz.startTime = performance.now();
  document.onkeydown = () => viz.startTime = performance.now();

  requestAnimationFrame(() => adjustParameters(audioData, viz));

  /**
   * @type {CanvasRenderingContext2D}
   */
  const ctx = analyzer.getContext('2d');

  const drawLoudness = () => {
    /** @type CanvasRenderingContext2D */
    ctx.clearRect(0, 0, analyzer.width, analyzer.height);

    audioData.loudnesses.forEach((loudness, i) => {
      const x = i / audioData.loudnesses.length * analyzer.width;
      const height = loudness / 256 * analyzer.height / 2;
      ctx.fillStyle = 'white';
      ctx.fillRect(x, analyzer.height, 1, -height);
    })
    requestAnimationFrame(drawLoudness);
  }
  requestAnimationFrame(drawLoudness);

  const drawFFT = () => {
    const waveform = audioData.getFrequencyData();


    for (let i = 0; i < waveform.length; i++) {
      const x = i / waveform.length * analyzer.width;
      const height = waveform[i] / 256 * analyzer.height / 2;
      // draw a rectangle down from the top of the canvas
      ctx.fillRect(x, 0, analyzer.width / waveform.length, height);
    }
    requestAnimationFrame(drawFFT);
  }
  requestAnimationFrame(drawFFT);
}


document.onclick = main
document.onkeydown = main
document.ontouchstart = main
// main();
