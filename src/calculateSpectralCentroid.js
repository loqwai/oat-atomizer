import { mu } from './mu.js';
export function calculateSpectralCentroid(ampSpectrum) {
  if (typeof ampSpectrum !== "object" || ampSpectrum.length === 0) {
    throw new TypeError('Invalid amplitude spectrum');
  }

  return mu(1, ampSpectrum);
}
