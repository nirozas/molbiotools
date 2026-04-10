import { NextRequest, NextResponse } from "next/server";

const MRNAID_BASE = "https://mrnaid.dichlab.org";

// Map our UI-friendly values to mRNAid API values
const ORGANISM_MAP: Record<string, string> = {
  "Homo Sapiens": "h_sapiens",
  "Mus musculus": "m_musculus",
};

const CRITERION_MAP: Record<string, string> = {
  "Match codon usage": "codon_usage",
  "Maximize Codon Adaptation Index (CAI)": "CAI",
  "Match dinucleotides usage": "dinucleotides",
  "Match codon pair usage": "codon_pair_usage",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mrnaConfig } = body as { mrnaConfig: any };

    const optimization_criterion = CRITERION_MAP[mrnaConfig.criterion] ?? "codon_usage";
    const organism = ORGANISM_MAP[mrnaConfig.organism] ?? "h_sapiens";

    // Submit one job per sequence and collect all task IDs
    const submittedJobs: Array<{ index: number; taskId: string; cds: string }> = [];

    for (let i = 0; i < mrnaConfig.sequences.length; i++) {
      const seq = mrnaConfig.sequences[i];
      if (!seq.cds.trim()) continue;

      const payload = {
        config: {
          avoided_motifs: mrnaConfig.avoidMotifs
            ? mrnaConfig.avoidMotifs.split(/[\s,;]+/).filter(Boolean)
            : [],
          codon_usage_frequency_threshold: parseFloat(mrnaConfig.threshold) || 0.1,
          max_GC_content: parseFloat(mrnaConfig.gcMax) / 100,
          min_GC_content: parseFloat(mrnaConfig.gcMin) / 100,
          GC_window_size: parseInt(mrnaConfig.gcWindow) || 100,
          organism,
          entropy_window: parseInt(mrnaConfig.entropyWindow) || 30,
          number_of_sequences: parseInt(mrnaConfig.numSequences) || 1,
        },
        uridine_depletion: !!mrnaConfig.uridineDepletion,
        precise_MFE_algorithm: !!mrnaConfig.preciseMfe,
        optimization_criterion,
        file_name: `seq${i + 1}`,
        sequences: {
          five_end_flanking_sequence: (seq.utr5.trim() || "A").replace(/T/g, "U").toUpperCase(),
          gene_of_interest: seq.cds.trim().toUpperCase().replace(/T/g, "U"),
          three_end_flanking_sequence: (seq.utr3.trim() || "A").replace(/T/g, "U").toUpperCase(),
        },
      };

      const response = await fetch(`${MRNAID_BASE}/api/v1/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          { error: `mRNAid rejected Sequence ${i + 1}: ${response.status} — ${errorText.slice(0, 300)}` },
          { status: 502 }
        );
      }

      const data = await response.json();
      const taskId = data.task_id ?? data.id ?? data.job_id;
      if (!taskId) {
        return NextResponse.json(
          { error: `mRNAid did not return a task_id for Sequence ${i + 1}. Response: ${JSON.stringify(data).slice(0, 300)}` },
          { status: 502 }
        );
      }

      submittedJobs.push({ index: i + 1, taskId, cds: seq.cds.slice(0, 20) + "..." });
    }

    return NextResponse.json({ jobs: submittedJobs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown proxy error" }, { status: 500 });
  }
}
