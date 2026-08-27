export interface FDRDataRow {
  id: string;
  pValue: number;
}

export interface FDRResultRow extends FDRDataRow {
  rank: number;
  qValue: number;
  isSignificant: boolean;
}

export interface FDRAnalysisResult {
  rows: FDRResultRow[];
  totalSignificant: number;
  fdrThreshold: number;
}

export function calculateFDR(data: FDRDataRow[], fdrThreshold: number = 0.05): FDRAnalysisResult {
  const validData = data.filter(d => !isNaN(d.pValue) && d.pValue >= 0 && d.pValue <= 1);
  const n = validData.length;

  // Clone and sort by p-value ascending
  const sorted = [...validData].sort((a, b) => a.pValue - b.pValue);
  
  const results: FDRResultRow[] = new Array(n);
  
  // Benjamini-Hochberg step-up procedure
  // Adjusted p-value = min( p_i * (n / i), adjusted_p_{i+1} )
  let nextQValue = 1;
  let totalSignificant = 0;

  // We iterate backwards from largest p-value to smallest
  for (let i = n - 1; i >= 0; i--) {
    const rank = i + 1;
    const pValue = sorted[i].pValue;
    
    let qValue = pValue * (n / rank);
    // q-values must be monotonically increasing with p-values
    if (qValue > nextQValue) {
      qValue = nextQValue;
    }
    // Cap at 1.0
    if (qValue > 1) {
      qValue = 1;
    }
    
    nextQValue = qValue;
    
    const isSignificant = qValue <= fdrThreshold;
    if (isSignificant) {
      totalSignificant++;
    }
    
    results[i] = {
      ...sorted[i],
      rank,
      qValue,
      isSignificant
    };
  }

  // Usually users want to see the original order or sorted by rank.
  // We'll return sorted by rank (smallest p-value first) since that's standard for volcano plots and tables.
  return {
    rows: results,
    totalSignificant,
    fdrThreshold
  };
}
