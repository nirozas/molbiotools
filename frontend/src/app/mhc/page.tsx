import MainApp from "@/components/MainApp";
import Navbar from "@/components/Navbar";
import ToolPageLayout from "@/components/ToolPageLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MHC-I & MHC-II Peptide Binding Predictor | Molecular Biology Tools",
  description:
    "Predict HLA class I (8–11-mer) and class II (13–25-mer) peptide binders using state-of-the-art scoring algorithms. Part of the Molecular Biology Tools platform.",
};

export default function MHCPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar />
      {/* spacer for fixed navbar */}
      <div style={{ height: "64px", flexShrink: 0 }} />
      <ToolPageLayout>
        <MainApp />
      </ToolPageLayout>
    </div>
  );
}
