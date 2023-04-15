import { SlimeMold } from 'http://cdn.jsdelivr.net/gh/loqwai/slime-molds@f267f2ef591f125914efe0c8ac404d740412fef5/src/SlimeMold.js';

const setRange = (slimeMold, mean) => {
  const range = 0.1 * mean / 128;
  slimeMold.setRange(range);

  info.textContent += `range: ${range}\n`;
}

const setTurnRate = (slimeMold, mean) => {
  // const turnRate = Math.max(0.1, 1 - ((mean - 100) / 28));
  const turnRate = 0.01 + (1 - (mean / 128));
  slimeMold.setTurnRate(turnRate)

  info.textContent += `turnRate: ${turnRate}\n`;
}

const setVelocityMultiplier = (slimeMold, mean) => {
  const velocityMultiplier = 0.01 + (mean / 128);
  slimeMold.setVelocityMultiplier(velocityMultiplier);

  info.textContent += `velocityMultiplier: ${velocityMultiplier}\n`;
}

const setSporeSize = (slimeMold, mean) => {
  const sporeSize = 1 + (5 * mean / 128)
  slimeMold.setSporeSize(sporeSize);
  info.textContent += `sporeSize: ${sporeSize}\n`;
}


const main = () => {
  const info = document.querySelector('#info');
  const canvas = document.querySelector('#visualizer');
  const slimeMold = new SlimeMold(canvas);
  slimeMold.start();


  const updateAudioParams = () => {
    requestAnimationFrame(updateAudioParams); // do this right up top so we can safely early return

    if (!window.waveform) return;

    /** @type {Uint8Array} */
    const waveform = window.frequencyData;
    const len = waveform.length;
    // const subarray = waveform.subarray(len - 100, len);
    const subarray = waveform;

    const mean = subarray.reduce((a, b) => a + b, 0) / subarray.length;

    info.textContent = '';
    info.textContent += `mean: ${mean}\n`
    // setRange(slimeMold, mean);
    setSporeSize(slimeMold, mean);
    setTurnRate(slimeMold, mean);
    setVelocityMultiplier(slimeMold, mean);
  }

  requestAnimationFrame(updateAudioParams);
}

main()