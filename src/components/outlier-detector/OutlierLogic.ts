// @ts-ignore
import { jStat } from "jstat";

export interface OutlierDataRow {
  id: string;
  value: number;
  group: string;
}

export interface OutlierResultRow extends OutlierDataRow {
  zScore: number;
  isGrubbsOutlier: boolean;
  isTukeyOutlier: boolean;
}

export interface OutlierGroupSummary {
  group: string;
  count: number;
  mean: number;
  stdDev: number;
  q1: number;
  median: number;
  q3: number;
  grubbsOutliersCount: number;
  tukeyOutliersCount: number;
}

export interface OutlierAnalysisResult {
  rows: OutlierResultRow[];
  summaries: OutlierGroupSummary[];
}

export function detectOutliers(data: OutlierDataRow[], alpha: number = 0.05): OutlierAnalysisResult {
  const groups = new Map<string, OutlierDataRow[]>();
  
  for (const row of data) {
    if (isNaN(row.value)) continue;
    const g = row.group || "Default";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(row);
  }

  const resultRows: OutlierResultRow[] = [];
  const summaries: OutlierGroupSummary[] = [];

  for (const [groupName, groupData] of Array.from(groups.entries())) {
    const values = groupData.map(d => d.value);
    const n = values.length;
    
    // Summary Stats
    const mean = jStat.mean(values);
    const stdDev = jStat.stdev(values, true); // sample stdev
    const quartiles = jStat.quartiles(values);
    const q1 = quartiles[0];
    const median = quartiles[1];
    const q3 = quartiles[2];
    const iqr = q3 - q1;
    
    // Tukey Fences
    const tukeyLower = q1 - 1.5 * iqr;
    const tukeyUpper = q3 + 1.5 * iqr;

    // Grubbs' Critical Value (approximate for two-sided test)
    let grubbsCrit = Infinity;
    if (n > 2 && stdDev > 0) {
      // t-distribution critical value with N-2 degrees of freedom at alpha / (2N)
      const tCrit = jStat.studentt.inv(1 - alpha / (2 * n), n - 2);
      const tCritSq = tCrit * tCrit;
      grubbsCrit = ((n - 1) / Math.sqrt(n)) * Math.sqrt(tCritSq / (n - 2 + tCritSq));
    }

    let grubbsCount = 0;
    let tukeyCount = 0;

    for (const row of groupData) {
      const zScore = stdDev > 0 ? (row.value - mean) / stdDev : 0;
      
      // Grubbs check
      const isGrubbsOutlier = Math.abs(zScore) > grubbsCrit;
      if (isGrubbsOutlier) grubbsCount++;
      
      // Tukey check
      const isTukeyOutlier = row.value < tukeyLower || row.value > tukeyUpper;
      if (isTukeyOutlier) tukeyCount++;

      resultRows.push({
        ...row,
        zScore,
        isGrubbsOutlier,
        isTukeyOutlier
      });
    }

    summaries.push({
      group: groupName,
      count: n,
      mean,
      stdDev,
      q1,
      median,
      q3,
      grubbsOutliersCount: grubbsCount,
      tukeyOutliersCount: tukeyCount
    });
  }

  return {
    rows: resultRows,
    summaries
  };
}
