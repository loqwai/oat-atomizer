import {mu} from './mu.js';
export function calculateSpectralSpread(fftData, sampleRate, fftSize) {
  // fftData= fftData.map(convertToLinearScale);
  const meanFrequency = mu(1, fftData, sampleRate, fftSize);
  const secondMoment = mu(2, fftData, sampleRate, fftSize);

  return Math.sqrt(secondMoment - Math.pow(meanFrequency, 2));
}
