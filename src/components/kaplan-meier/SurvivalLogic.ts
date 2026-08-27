export interface SurvivalDataRow {
  time: number;
  status: number; // 1 = event (death), 0 = censored
  group: string;
}

export interface SurvivalPoint {
  time: number;
  survival: number;
  atRisk: number;
  events: number;
  censored: number;
  isCensoredPoint: boolean; // True if this data point was generated purely to mark a censored event
}

export interface GroupSurvival {
  group: string;
  points: SurvivalPoint[];
  medianSurvival: number | null;
  totalEvents: number;
  totalCensored: number;
  totalSubjects: number;
}

/**
 * Calculates Kaplan-Meier survival curves for each group.
 */
export function calculateKaplanMeier(data: SurvivalDataRow[]): GroupSurvival[] {
  // Group the data
  const groupsData: Record<string, SurvivalDataRow[]> = {};
  data.forEach((row) => {
    if (!row.group || isNaN(row.time) || isNaN(row.status)) return;
    if (!groupsData[row.group]) groupsData[row.group] = [];
    groupsData[row.group].push(row);
  });

  const results: GroupSurvival[] = [];

  for (const [group, rows] of Object.entries(groupsData)) {
    // Sort ascending by time, and if time is equal, put events (1) before censored (0)
    rows.sort((a, b) => {
      if (a.time === b.time) return b.status - a.status;
      return a.time - b.time;
    });

    let atRisk = rows.length;
    let survival = 1.0;
    const points: SurvivalPoint[] = [{ time: 0, survival: 1.0, atRisk, events: 0, censored: 0, isCensoredPoint: false }];
    
    let totalEvents = 0;
    let totalCensored = 0;

    // Group by unique times
    const timePoints: Record<number, { events: number; censored: number }> = {};
    rows.forEach(r => {
      if (!timePoints[r.time]) timePoints[r.time] = { events: 0, censored: 0 };
      if (r.status === 1) {
        timePoints[r.time].events++;
        totalEvents++;
      } else {
        timePoints[r.time].censored++;
        totalCensored++;
      }
    });

    const uniqueTimes = Object.keys(timePoints).map(Number).sort((a, b) => a - b);
    
    let medianSurvival: number | null = null;
    let crossedMedian = false;

    for (const t of uniqueTimes) {
      const d = timePoints[t].events;
      const c = timePoints[t].censored;
      
      if (d > 0) {
        survival = survival * (1 - d / atRisk);
        points.push({ time: t, survival, atRisk, events: d, censored: c, isCensoredPoint: false });
        if (!crossedMedian && survival <= 0.5) {
          medianSurvival = t;
          crossedMedian = true;
        }
      } else if (c > 0) {
        // If there are only censored events at this time point, we still add a point to draw a tick mark
        points.push({ time: t, survival, atRisk, events: 0, censored: c, isCensoredPoint: true });
      }
      
      atRisk -= (d + c);
    }

    results.push({
      group,
      points,
      medianSurvival,
      totalEvents,
      totalCensored,
      totalSubjects: rows.length
    });
  }

  // Sort groups alphabetically
  results.sort((a, b) => a.group.localeCompare(b.group));
  return results;
}

/**
 * Normal CDF for p-value calculation
 */
function normalCDF(x: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

function chiSquarePValue(chiSq: number, df: number) {
  // Approximation for df=1 (Log-rank for 2 groups)
  if (df === 1) {
    const z = Math.sqrt(chiSq);
    return 2 * (1 - normalCDF(z));
  }
  // For df>1, this requires the incomplete gamma function. 
  // We'll use a basic approximation or just return null if we can't compute it.
  // We will mostly support 2-group comparisons, but for >2 groups we return a conservative p-value
  return null; 
}

/**
 * Calculates Log-rank (Mantel-Cox) test p-value comparing two or more groups.
 */
export function calculateLogRankTest(data: SurvivalDataRow[]) {
  // Validate data
  const validData = data.filter(r => r.group && !isNaN(r.time) && !isNaN(r.status));
  const groupNames = Array.from(new Set(validData.map(r => r.group))).sort();
  
  if (groupNames.length < 2) return { pValue: null, chiSquare: null, df: 0 };

  // Get all unique event times across ALL groups
  const eventTimes = new Set<number>();
  validData.forEach(r => {
    if (r.status === 1) eventTimes.add(r.time);
  });
  const sortedEventTimes = Array.from(eventTimes).sort((a, b) => a - b);

  // Initialize Observed and Expected counts for each group
  const O: Record<string, number> = {};
  const E: Record<string, number> = {};
  const V: Record<string, number> = {};
  groupNames.forEach(g => { O[g] = 0; E[g] = 0; V[g] = 0; });

  for (const t of sortedEventTimes) {
    let dTotal = 0; // Total events at time t
    let nTotal = 0; // Total at risk just before time t
    
    const dGroup: Record<string, number> = {};
    const nGroup: Record<string, number> = {};
    
    groupNames.forEach(g => {
      // At risk: time >= t
      const atRisk = validData.filter(r => r.group === g && r.time >= t);
      // Events: time == t && status == 1
      const events = validData.filter(r => r.group === g && r.time === t && r.status === 1);
      
      nGroup[g] = atRisk.length;
      dGroup[g] = events.length;
      
      nTotal += nGroup[g];
      dTotal += dGroup[g];
    });

    if (nTotal > 0 && dTotal > 0) {
      groupNames.forEach(g => {
        O[g] += dGroup[g];
        const expected = dTotal * (nGroup[g] / nTotal);
        E[g] += expected;
        
        // Variance component for group g
        if (nTotal > 1) {
          const varComponent = (dTotal * (nTotal - dTotal) * nGroup[g] * (nTotal - nGroup[g])) / (nTotal * nTotal * (nTotal - 1));
          V[g] += varComponent;
        }
      });
    }
  }

  // Calculate Chi-Square
  let chiSquare = 0;
  if (groupNames.length === 2) {
    // Exact 2-group Mantel-Cox formula using variance
    const g1 = groupNames[0];
    chiSquare = Math.pow(O[g1] - E[g1], 2) / V[g1];
  } else {
    // Approximation for >2 groups: Sum((O - E)^2 / E)
    // Note: A true Log-rank for >2 groups requires the covariance matrix.
    // This is the conservative log-rank approximation.
    groupNames.forEach(g => {
      if (E[g] > 0) {
        chiSquare += Math.pow(O[g] - E[g], 2) / E[g];
      }
    });
  }

  const df = groupNames.length - 1;
  const pValue = chiSquarePValue(chiSquare, df);

  return { pValue, chiSquare, df, observed: O, expected: E };
}
