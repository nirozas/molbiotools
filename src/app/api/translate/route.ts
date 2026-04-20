import { NextRequest, NextResponse } from "next/server";

const GENETIC_CODE: Record<string, string> = {
    'ATA':'I','ATC':'I','ATT':'I','ATG':'M',
    'ACA':'T','ACC':'T','ACG':'T','ACT':'T',
    'AAC':'N','AAT':'N','AAA':'K','AAG':'K',
    'AGC':'S','AGT':'S','AGA':'R','AGG':'R',
    'CTA':'L','CTC':'L','CTG':'L','CTT':'L',
    'CCA':'P','CCC':'P','CCG':'P','CCT':'P',
    'CAC':'H','CAT':'H','CAA':'Q','CAG':'Q',
    'CGA':'R','CGC':'R','CGG':'R','CGT':'R',
    'GTA':'V','GTC':'V','GTG':'V','GTT':'V',
    'GCA':'A','GCC':'A','GCG':'A','GCT':'A',
    'GAC':'D','GAT':'D','GAA':'E','GAG':'E',
    'GGA':'G','GGC':'G','GGG':'G','GGT':'G',
    'TCA':'S','TCC':'S','TCG':'S','TCT':'S',
    'TTC':'F','TTT':'F','TTA':'L','TTG':'L',
    'TAC':'Y','TAT':'Y','TAA':'_','TAG':'_',
    'TGC':'C','TGT':'C','TGA':'_','TGG':'W',
};

function translateDNA(dna: string): string {
    const sequence = dna.toUpperCase().replace(/[^ATCG]/g, "");
    let protein = "";
    for (let i = 0; i < sequence.length - 2; i += 3) {
        const codon = sequence.substring(i, i + 3);
        const aa = GENETIC_CODE[codon] ?? "X";
        if (aa === "_") break; // stop codon
        protein += aa;
    }
    return protein;
}

export async function POST(req: NextRequest) {
    try {
        const { sequence } = await req.json();
        if (!sequence) return NextResponse.json({ error: "No sequence provided" }, { status: 400 });
        const translated = translateDNA(sequence);
        return NextResponse.json({ translated });
    } catch (err: any) {
        return NextResponse.json({ error: err.message ?? "Translation failed" }, { status: 500 });
    }
}
