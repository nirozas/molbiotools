// Randomization algorithms for in vivo group assignments

/**
 * Shuffles an array in place using Fisher-Yates algorithm.
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Performs simple random assignment into G groups.
 */
export function simpleRandomization(totalSubjects: number, groupNames: string[]): string[] {
  const assignments: string[] = [];
  const numGroups = groupNames.length;
  if (numGroups === 0) return assignments;
  
  // Create a perfectly balanced array of group assignments
  const baseSize = Math.floor(totalSubjects / numGroups);
  const remainder = totalSubjects % numGroups;
  
  for (let i = 0; i < numGroups; i++) {
    for (let j = 0; j < baseSize; j++) {
      assignments.push(groupNames[i]);
    }
  }
  
  // For the remainder, randomly pick groups to get the extra subjects
  const extraGroups = shuffleArray([...groupNames]).slice(0, remainder);
  for (const g of extraGroups) {
    assignments.push(g);
  }
  
  // Shuffle the final array to randomize the order
  return shuffleArray(assignments);
}

/**
 * Performs a blocked (stratified) randomization based on a primary covariate.
 * Guarantees similar distribution of the covariate across all groups.
 */
export function stratifiedRandomization(
  data: Record<string, any>[],
  groupNames: string[],
  covariateKeys: string[]
): Record<string, any>[] {
  const numGroups = groupNames.length;
  if (numGroups === 0 || covariateKeys.length === 0) return data;
  
  // Filter out any rows that don't have valid numeric covariates for ALL keys
  const validData = data.filter(row => 
    covariateKeys.every(k => row[k] !== undefined && row[k] !== null && !isNaN(Number(row[k])))
  );
  const invalidData = data.filter(row => 
    covariateKeys.some(k => row[k] === undefined || row[k] === null || isNaN(Number(row[k])))
  );
  
  // Sort descending by the primary (first) covariate to form blocks
  const primaryKey = covariateKeys[0];
  validData.sort((a, b) => Number(b[primaryKey]) - Number(a[primaryKey]));

  // Pre-compute Z-score standardizations for all valid data to weight covariates equally
  const statsPerCovariate: Record<string, { mean: number; stdDev: number }> = {};
  for (const key of covariateKeys) {
    const vals = validData.map(r => Number(r[key]));
    const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    const variance = vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (vals.length || 1);
    const stdDev = Math.sqrt(variance) || 1; // avoid division by zero
    statsPerCovariate[key] = { mean, stdDev };
  }

  const ITERATIONS = 10000;
  let bestAssignment: string[] = [];
  let minCompositeVariance = Infinity;

  // Run Monte Carlo simulation
  for (let iter = 0; iter < ITERATIONS; iter++) {
    const currentAssignment: string[] = [];
    
    // Assign blocks
    for (let i = 0; i < validData.length; i += numGroups) {
      const block = validData.slice(i, i + numGroups);
      const availableGroups = shuffleArray([...groupNames]).slice(0, block.length);
      for (let j = 0; j < block.length; j++) {
        currentAssignment.push(availableGroups[j]);
      }
    }

    // Evaluate composite variance
    let compositeVariance = 0;
    
    for (const key of covariateKeys) {
      const groupSums: Record<string, number> = {};
      const groupCounts: Record<string, number> = {};
      groupNames.forEach(g => { groupSums[g] = 0; groupCounts[g] = 0; });
      
      for (let i = 0; i < validData.length; i++) {
        const group = currentAssignment[i];
        const rawVal = Number(validData[i][key]);
        const zScore = (rawVal - statsPerCovariate[key].mean) / statsPerCovariate[key].stdDev;
        groupSums[group] += zScore;
        groupCounts[group]++;
      }
      
      const means = groupNames.map(g => groupCounts[g] > 0 ? groupSums[g] / groupCounts[g] : 0);
      const overallMean = means.reduce((a, b) => a + b, 0) / numGroups;
      const variance = means.reduce((acc, val) => acc + Math.pow(val - overallMean, 2), 0) / numGroups;
      
      compositeVariance += variance;
    }

    // Save if it's the best one so far
    if (compositeVariance < minCompositeVariance) {
      minCompositeVariance = compositeVariance;
      bestAssignment = [...currentAssignment];
    }
  }
  
  const result: Record<string, any>[] = [];
  for (let i = 0; i < validData.length; i++) {
    result.push({
      ...validData[i],
      Group: bestAssignment[i]
    });
  }

  // For invalid data, just dump them into an unassigned group or randomly assign
  for (const row of invalidData) {
    result.push({
      ...row,
      Group: "Unassigned (Invalid Covariate)"
    });
  }
  
  return result;
}

/**
 * Calculates statistics (mean, SE, count) for a specific covariate across all groups
 */
export function calculateGroupStats(data: Record<string, any>[], covariateKey: string) {
  const groups: Record<string, number[]> = {};
  
  for (const row of data) {
    const group = row['Assigned Group'] || row.Group;
    if (!group || group.startsWith("Unassigned")) continue;
    
    if (!groups[group]) {
      groups[group] = [];
    }
    
    const val = Number(row[covariateKey]);
    if (!isNaN(val)) {
      groups[group].push(val);
    }
  }
  
  const stats = [];
  for (const [group, values] of Object.entries(groups)) {
    const count = values.length;
    if (count === 0) continue;
    
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / count;
    
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (count - 1 || 1); // Sample variance
    const stdDev = Math.sqrt(variance);
    const stdErr = stdDev / Math.sqrt(count);
    
    // Sort values for quartiles and min/max
    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    
    const getPercentile = (arr: number[], p: number) => {
      if (arr.length === 0) return 0;
      if (arr.length === 1) return arr[0];
      const index = (arr.length - 1) * p;
      const lower = Math.floor(index);
      const upper = lower + 1;
      const weight = index - lower;
      if (upper >= arr.length) return arr[lower];
      return arr[lower] * (1 - weight) + arr[upper] * weight;
    };

    const q1 = getPercentile(sorted, 0.25);
    const median = getPercentile(sorted, 0.5);
    const q3 = getPercentile(sorted, 0.75);

    stats.push({
      group,
      count,
      mean,
      stdDev,
      stdErr,
      min,
      max,
      q1,
      median,
      q3
    });
  }
  
  // Sort by group name natively
  stats.sort((a, b) => a.group.localeCompare(b.group, undefined, {numeric: true, sensitivity: 'base'}));
  
  return stats;
}
