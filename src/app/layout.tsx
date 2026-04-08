import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Molecular Biology Tools | Modern Bioinformatics Platform",
  description:
    "A comprehensive suite of molecular biology tools for DNA analysis, RNA processing, protein analysis, metabolomics, and immunoinformatics research.",
  keywords: [
    "molecular biology",
    "bioinformatics",
    "DNA tools",
    "RNA tools",
    "protein analysis",
    "MHC binding",
    "peptide prediction",
  ],
};

import CopyrightManager from "@/components/CopyrightManager";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased no-copy">
        <CopyrightManager />
        {children}
      </body>
    </html>
  );
}
