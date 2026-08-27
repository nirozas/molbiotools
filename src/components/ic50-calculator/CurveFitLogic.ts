import { levenbergMarquardt } from "ml-levenberg-marquardt";

export interface DoseResponseDataRow {
  concentration: number; // usually uM or nM
  response: number;      // % viability, absorbance, etc.
  group: string;
}

export interface CurveFitResult {
  group: string;
  points: { x: number; y: number }[]; // scatter points
  curve: { x: number; y: number }[]; // fitted curve points
  ic50: number | null;
  hillSlope: number | null;
  rSquared: number | null;
  min: number | null;
  max: number | null;
}

// Standard Biological 4PL Equation (GraphPad Prism equivalent)
// y = min + (max - min) / (1 + 10^((LogIC50 - x) * hillSlope))
// where x is Log10(Concentration)
function fourPL([min, max, logIC50, hillSlope]: number[]) {
  return (x: number) => min + (max - min) / (1 + Math.pow(10, (logIC50 - x) * hillSlope));
}

// Initialize parameters for the solver based on raw data
// Note: x is passed as Log10(Concentration)
function guessInitialParameters(x: number[], y: number[]) {
  const min_y = Math.min(...y);
  const max_y = Math.max(...y);
  const mid_y = (min_y + max_y) / 2;
  
  // Estimate LogIC50 as the logX value where y is closest to mid_y
  let closestDist = Infinity;
  let estimatedLogIC50 = x[Math.floor(x.length / 2)];
  
  for (let i = 0; i < x.length; i++) {
    const dist = Math.abs(y[i] - mid_y);
    if (dist < closestDist) {
      closestDist = dist;
      estimatedLogIC50 = x[i];
    }
  }

  // Hill slope guess
  // If Y goes down as X goes up (inhibition), hillSlope MUST be negative in this specific equation format
  const isInhibitory = y[0] > y[y.length - 1];
  const hillSlope = isInhibitory ? -1 : 1;

  return [min_y, max_y, estimatedLogIC50, hillSlope];
}

function calculateRSquared(x: number[], y: number[], fittedFunction: (x: number) => number) {
  const yMean = y.reduce((a, b) => a + b, 0) / y.length;
  let ssTot = 0;
  let ssRes = 0;
  
  for (let i = 0; i < x.length; i++) {
    const yPred = fittedFunction(x[i]);
    ssTot += Math.pow(y[i] - yMean, 2);
    ssRes += Math.pow(y[i] - yPred, 2);
  }
  
  return ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
}

export function fitDoseResponseCurves(data: DoseResponseDataRow[]): CurveFitResult[] {
  // Group the data
  const groups = new Map<string, { x: number[], y: number[] }>();
  
  for (const row of data) {
    if (!row.group || isNaN(row.concentration) || isNaN(row.response)) continue;
    if (row.concentration <= 0) continue; // Log models require concentration > 0
    
    if (!groups.has(row.group)) {
      groups.set(row.group, { x: [], y: [] });
    }
    groups.get(row.group)!.x.push(row.concentration);
    groups.get(row.group)!.y.push(row.response);
  }

  const results: CurveFitResult[] = [];

  for (const [groupName, groupData] of Array.from(groups.entries())) {
    // Sort x values for proper curve generation later
    const zipped = groupData.x.map((x, i) => ({ x, y: groupData.y[i] })).sort((a, b) => a.x - b.x);
    const sortedX = zipped.map(d => d.x);
    const sortedY = zipped.map(d => d.y);
    
    // Transform X to Log10 for mathematical stability and standard Prism equations
    const logX = sortedX.map(x => Math.log10(x));

    const scatterPoints = zipped.map(d => ({ x: d.x, y: d.y }));

    if (sortedX.length < 4) {
      // Need at least 4 points for a 4PL fit
      results.push({
        group: groupName,
        points: scatterPoints,
        curve: [],
        ic50: null,
        hillSlope: null,
        rSquared: null,
        min: null,
        max: null
      });
      continue;
    }

    const initialValues = guessInitialParameters(logX, sortedY);
    
    const options = {
      damping: 1.5,
      initialValues,
      gradientDifference: 10e-2,
      maxIterations: 100,
      errorTolerance: 10e-3
    };

    try {
      const fitted = levenbergMarquardt({ x: logX, y: sortedY }, fourPL, options);
      const [fitMin, fitMax, fitLogIC50, fitHill] = fitted.parameterValues;
      const fitFunc = fourPL(fitted.parameterValues);
      const r2 = calculateRSquared(logX, sortedY, fitFunc);

      // Convert LogIC50 back to IC50 (linear scale)
      const actualIC50 = Math.pow(10, fitLogIC50);

      // Generate a smooth curve for plotting
      // We'll generate 100 points on a log scale between the min and max X
      const minLog = Math.log10(sortedX[0]);
      const maxLog = Math.log10(sortedX[sortedX.length - 1]);
      const curvePoints = [];
      const steps = 100;
      
      for (let i = 0; i <= steps; i++) {
        const currentLogX = minLog + (maxLog - minLog) * (i / steps);
        const x = Math.pow(10, currentLogX);
        const y = fitFunc(currentLogX);
        curvePoints.push({ x, y });
      }

      results.push({
        group: groupName,
        points: scatterPoints,
        curve: curvePoints,
        ic50: actualIC50,
        hillSlope: fitHill,
        rSquared: r2,
        min: fitMin,
        max: fitMax
      });
    } catch (err) {
      console.error(`LM fit failed for group ${groupName}:`, err);
      results.push({
        group: groupName,
        points: scatterPoints,
        curve: [],
        ic50: null,
        hillSlope: null,
        rSquared: null,
        min: null,
        max: null
      });
    }
  }

  return results;
}
