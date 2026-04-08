export interface Contributor {
  name: string;
  institute: string;
  contributions: number;
}

export const contributors: Contributor[] = [
  { name: "DTU Health Tech", institute: "Department of Health Technology", contributions: 2 },
  { name: "Open Source Community", institute: "Global Contributors", contributions: 12 },
];
