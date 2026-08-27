import { jStat } from 'jstat';

/**
 * Calculates the required sample size for a two-sample t-test (Continuous Endpoint).
 * Uses a normal approximation for simplicity and speed (very close to t-dist for n>10).
 */
export function getContinuousPower(
  effectSize: number,
  alpha: number,
  power: number
): number {
  if (effectSize === 0) return NaN;
  const zAlpha = jStat.normal.inv(1 - alpha / 2, 0, 1);
  const zBeta = jStat.normal.inv(power, 0, 1);
  
  // n = 2 * ((zAlpha + zBeta) / effectSize)^2
  const n = 2 * Math.pow((zAlpha + zBeta) / effectSize, 2);
  return n;
}

/**
 * Calculates the required sample size (number of subjects per group) for a survival endpoint.
 * Uses the Freedman method approximation for the log-rank test.
 */
export function getSurvivalPower(
  hr: number,
  alpha: number,
  power: number
): number {
  if (hr === 1.0) return NaN;
  const zAlpha = jStat.normal.inv(1 - alpha / 2, 0, 1);
  const zBeta = jStat.normal.inv(power, 0, 1);
  
  // Number of events E = ((zAlpha + zBeta) * (1 + hr) / (1 - hr))^2
  const events = Math.pow((zAlpha + zBeta) * (1 + hr) / (1 - hr), 2);
  
  // Assuming in preclinical studies all subjects reach the endpoint (100% events),
  // n per group = total events / 2
  return events / 2;
}

/**
 * Calculates the required sample size for a binary endpoint.
 * Uses the two-proportion z-test (Cohen's h).
 */
export function getBinaryPower(
  p1: number,
  p2: number,
  alpha: number,
  power: number
): number {
  // Cohen's h for proportions
  const h = 2 * Math.asin(Math.sqrt(p1)) - 2 * Math.asin(Math.sqrt(p2));
  if (h === 0) return NaN;
  
  const zAlpha = jStat.normal.inv(1 - alpha / 2, 0, 1);
  const zBeta = jStat.normal.inv(power, 0, 1);
  
  // n = 2 * ((zAlpha + zBeta) / h)^2
  const n = 2 * Math.pow((zAlpha + zBeta) / h, 2);
  return n;
}

/**
 * Calculates the statistical power given a specific sample size (n per group) 
 * for continuous endpoints.
 */
export function calculateContinuousPowerFromN(
  effectSize: number,
  alpha: number,
  n: number
): number {
  if (effectSize === 0) return NaN;
  const zAlpha = jStat.normal.inv(1 - alpha / 2, 0, 1);
  // effectSize = (zAlpha + zBeta) * sqrt(2/n)
  // zBeta = effectSize / sqrt(2/n) - zAlpha
  const zBeta = Math.abs(effectSize) / Math.sqrt(2 / n) - zAlpha;
  return jStat.normal.cdf(zBeta, 0, 1);
}

/**
 * Calculates the statistical power given a specific sample size (n per group) 
 * for survival endpoints.
 */
export function calculateSurvivalPowerFromN(
  hr: number,
  alpha: number,
  n: number
): number {
  if (hr === 1.0) return NaN;
  const zAlpha = jStat.normal.inv(1 - alpha / 2, 0, 1);
  const E = 2 * n; // Assuming 100% events
  // sqrt(E) = (zAlpha + zBeta) * |1+hr| / |1-hr|
  const zBeta = Math.sqrt(E) * Math.abs(1 - hr) / (1 + hr) - zAlpha;
  return jStat.normal.cdf(zBeta, 0, 1);
}

/**
 * Calculates the statistical power given a specific sample size (n per group) 
 * for binary endpoints.
 */
export function calculateBinaryPowerFromN(
  p1: number,
  p2: number,
  alpha: number,
  n: number
): number {
  const h = Math.abs(2 * Math.asin(Math.sqrt(p1)) - 2 * Math.asin(Math.sqrt(p2)));
  if (h === 0) return NaN;
  const zAlpha = jStat.normal.inv(1 - alpha / 2, 0, 1);
  const zBeta = h / Math.sqrt(2 / n) - zAlpha;
  return jStat.normal.cdf(zBeta, 0, 1);
}
