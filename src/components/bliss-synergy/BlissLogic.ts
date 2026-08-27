export interface BlissDataRow {
  id: string;
  drugAInhibition: number; // 0-100%
  drugBInhibition: number; // 0-100%
  comboInhibition: number; // 0-100%
}

export interface BlissResultRow extends BlissDataRow {
  expectedBliss: number; // 0-100%
  synergyScore: number; // Positive = Synergy, Negative = Antagonism
  interpretation: string;
}

export interface BlissAnalysisResult {
  rows: BlissResultRow[];
  averageSynergy: number;
}

export function calculateBliss(data: BlissDataRow[]): BlissAnalysisResult {
  const validData = data.filter(d => 
    !isNaN(d.drugAInhibition) && 
    !isNaN(d.drugBInhibition) && 
    !isNaN(d.comboInhibition)
  );

  const results: BlissResultRow[] = validData.map(row => {
    // Convert percentages to fractions for math
    const Ea = row.drugAInhibition / 100;
    const Eb = row.drugBInhibition / 100;
    const Eab = row.comboInhibition / 100;

    // Bliss Independence Formula: E_expected = Ea + Eb - (Ea * Eb)
    const expectedBlissFraction = Ea + Eb - (Ea * Eb);
    
    // Convert back to percentage
    const expectedBliss = expectedBlissFraction * 100;
    
    // Score = Observed - Expected
    // If Observed > Expected -> Synergy (positive score)
    // If Observed < Expected -> Antagonism (negative score)
    const synergyScore = row.comboInhibition - expectedBliss;
    
    let interpretation = "Additive";
    if (synergyScore > 5) interpretation = "Synergistic";
    if (synergyScore < -5) interpretation = "Antagonistic";

    return {
      ...row,
      expectedBliss,
      synergyScore,
      interpretation
    };
  });

  const averageSynergy = results.length > 0
    ? results.reduce((acc, val) => acc + val.synergyScore, 0) / results.length
    : 0;

  return {
    rows: results,
    averageSynergy
  };
}
