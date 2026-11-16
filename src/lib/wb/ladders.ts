export interface LadderBand {
  mw: number; // kDa
  color?: string; // optional prestained reference color
  thick?: boolean;
}

export interface Ladder {
  id: string;
  name: string;
  range: string;
  bands: LadderBand[];
}

export const LADDERS: Ladder[] = [
  {
    id: "biorad-dual",
    name: "Bio-Rad Precision Plus Dual Color (10–250 kDa)",
    range: "10–250 kDa",
    bands: [
      { mw: 250, color: "#2563eb" },
      { mw: 150, color: "#2563eb" },
      { mw: 100, color: "#2563eb" },
      { mw: 75, color: "#ec4899", thick: true },
      { mw: 50, color: "#2563eb" },
      { mw: 37, color: "#2563eb" },
      { mw: 25, color: "#ec4899", thick: true },
      { mw: 20, color: "#2563eb" },
      { mw: 15, color: "#2563eb" },
      { mw: 10, color: "#2563eb" },
    ],
  },
  {
    id: "pageruler",
    name: "Thermo PageRuler Prestained (10–180 kDa)",
    range: "10–180 kDa",
    bands: [
      { mw: 180, color: "#2563eb" },
      { mw: 130, color: "#2563eb" },
      { mw: 100, color: "#2563eb" },
      { mw: 70, color: "#f97316", thick: true },
      { mw: 55, color: "#2563eb" },
      { mw: 40, color: "#2563eb" },
      { mw: 35, color: "#2563eb" },
      { mw: 25, color: "#2563eb" },
      { mw: 15, color: "#2563eb" },
      { mw: 10, color: "#10b981", thick: true },
    ],
  },
  {
    id: "pageruler-plus",
    name: "Thermo PageRuler Plus Prestained (10–250 kDa)",
    range: "10–250 kDa",
    bands: [
      { mw: 250, color: "#2563eb" },
      { mw: 130, color: "#2563eb" },
      { mw: 100, color: "#2563eb" },
      { mw: 70, color: "#f97316", thick: true },
      { mw: 55, color: "#2563eb" },
      { mw: 35, color: "#2563eb" },
      { mw: 25, color: "#f97316", thick: true },
      { mw: 15, color: "#2563eb" },
      { mw: 10, color: "#10b981" },
    ],
  },
  {
    id: "neb-broad",
    name: "NEB Color Prestained Broad Range (10–250 kDa)",
    range: "10–250 kDa",
    bands: [
      { mw: 250, color: "#2563eb" },
      { mw: 180, color: "#2563eb" },
      { mw: 130, color: "#2563eb" },
      { mw: 95, color: "#2563eb" },
      { mw: 72, color: "#f97316", thick: true },
      { mw: 55, color: "#2563eb" },
      { mw: 43, color: "#2563eb" },
      { mw: 34, color: "#2563eb" },
      { mw: 26, color: "#f97316", thick: true },
      { mw: 17, color: "#10b981" },
      { mw: 10, color: "#2563eb" },
    ],
  },
  {
    id: "himark",
    name: "Thermo HiMark High-MW (30–460 kDa)",
    range: "30–460 kDa",
    bands: [
      { mw: 460, color: "#2563eb" },
      { mw: 268, color: "#2563eb", thick: true },
      { mw: 238, color: "#2563eb" },
      { mw: 171, color: "#2563eb" },
      { mw: 117, color: "#2563eb" },
      { mw: 71, color: "#f97316", thick: true },
      { mw: 55, color: "#2563eb" },
      { mw: 41, color: "#2563eb" },
      { mw: 31, color: "#2563eb" },
    ],
  },
  {
    id: "low-range",
    name: "Low-Range Peptide Ladder (1.7–40 kDa)",
    range: "1.7–40 kDa",
    bands: [
      { mw: 40, color: "#f97316" },
      { mw: 26, color: "#ec4899" },
      { mw: 17, color: "#2563eb" },
      { mw: 10, color: "#10b981" },
      { mw: 4.6, color: "#2563eb" },
      { mw: 1.7, color: "#2563eb" },
    ],
  },
];

export interface GelType {
  id: string;
  name: string;
  mid: number; // inflection MW (kDa)
  slope: number;
  note: string;
}

export const GELS: GelType[] = [
  { id: "4-20", name: "4–20% Gradient", mid: 45, slope: 0.92, note: "Broad range (5–300 kDa)" },
  { id: "4-12", name: "4–12% Bis-Tris", mid: 52, slope: 1.05, note: "Wide range (10–250 kDa)" },
  { id: "8", name: "8% SDS-PAGE", mid: 95, slope: 1.35, note: "High MW resolution (35–250+ kDa)" },
  { id: "10", name: "10% SDS-PAGE", mid: 58, slope: 1.35, note: "Standard range (20–180 kDa)" },
  { id: "12", name: "12% SDS-PAGE", mid: 40, slope: 1.4, note: "Mid-low range (12–110 kDa)" },
  { id: "15", name: "15% SDS-PAGE", mid: 22, slope: 1.45, note: "Small proteins (4–55 kDa)" },
];

/** Relative migration distance (0 = top of resolving gel, 1 = dye front). */
export function gelMobility(mwKda: number, gel: GelType): number {
  const safeMw = Math.max(0.5, mwKda);
  const raw = 1 / (1 + Math.pow(safeMw / gel.mid, gel.slope));
  // map [0, 1] comfortably inside [0.05, 0.94] of gel height
  return 0.05 + raw * 0.89;
}

export function parseCustomLadder(input: string): LadderBand[] {
  const vals = input
    .split(/[,\s;]+/)
    .map((x) => parseFloat(x))
    .filter((n) => isFinite(n) && n > 0 && n <= 5000);
  const unique = Array.from(new Set(vals)).sort((a, b) => b - a);
  return unique.map((mw) => ({ mw, color: "#2563eb" }));
}
