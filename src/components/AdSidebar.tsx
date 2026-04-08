"use client";

import React from "react";
import { 
  ExternalLink, 
  Info, 
  Beaker, 
  ShieldCheck, 
  FlaskConical,
  ShoppingCart
} from "lucide-react";
import { motion } from "framer-motion";

interface Ad {
  id: string;
  title: string;
  company: string;
  description: string;
  image?: string;
  link: string;
  category: string[];
}

const MOCK_ADS: Ad[] = [
  {
    id: "ad1",
    title: "High-Fidelity DNA Polymerase",
    company: "BioLabs Solutions",
    description: "Achieve unmatched accuracy in your PCR with our new ultra-stable polymerase. 50% faster cycles.",
    link: "https://example.com/pcr",
    category: ["dna", "rna"]
  },
  {
    id: "ad2",
    title: "Custom Antibody Synthesis",
    company: "ImmunoTech",
    description: "High specificity polyclonal and monoclonal antibodies tailored to your specific protein motifs.",
    link: "https://example.com/antibodies",
    category: ["protein", "immunology"]
  },
  {
    id: "ad3",
    title: "Next-Gen Sequencing Kits",
    company: "Genomix Dynamics",
    description: "Complete libraries in under 3 hours. Compatible with all major NGS platforms.",
    link: "https://example.com/ngs",
    category: ["genomics", "dna"]
  },
  {
    id: "ad4",
    title: "HPLC Precision Columns",
    company: "ChemPure",
    description: "Ultimate resolution for small molecule and metabolite purification. Buy 2 get 1 free.",
    link: "https://example.com/hplc",
    category: ["metabolism"]
  },
  {
    id: "ad5",
    title: "Lab Inventory Management 2.0",
    company: "SciFlow",
    description: "Stop wasting reagents. Track every kit and enzyme in your freezer with cloud-smart labels.",
    link: "https://example.com/sciflow",
    category: ["calculators", "dna", "rna", "protein"]
  }
];

interface AdSidebarProps {
  currentCategory?: string;
}

export default function AdSidebar({ currentCategory }: AdSidebarProps) {
  // Filter ads based on current category or show general ones
  const filteredAds = currentCategory 
    ? MOCK_ADS.filter(ad => ad.category.includes(currentCategory.toLowerCase()))
    : MOCK_ADS;

  // If no match, show all
  const displayedAds = filteredAds.length > 0 ? filteredAds : MOCK_ADS;

  return (
    <aside style={{ 
      width: "100%", 
      padding: "1rem", 
      display: "flex", 
      flexDirection: "column", 
      gap: "1.5rem",
      background: "transparent",
      height: "calc(100vh - 80px)",
      position: "sticky",
      top: "80px",
      overflowY: "auto",
      zIndex: 10
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <h4 style={{ fontSize: "0.75rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em" }}>Sponsored Resources</h4>
        <div style={{ padding: "0.2rem", cursor: "help" }} title="Ads help keep these tools free for the scientific community">
          <Info size={12} color="#475569" />
        </div>
      </div>

      {displayedAds.slice(0, 3).map((ad) => (
        <motion.div
          key={ad.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.02 }}
          style={{ 
            background: "rgba(15, 23, 42, 0.4)", 
            borderRadius: "16px", 
            border: "1px solid rgba(148, 163, 184, 0.08)",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ 
              width: "32px", 
              height: "32px", 
              borderRadius: "8px", 
              background: "rgba(0, 212, 255, 0.1)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              color: "#00d4ff"
            }}>
              {ad.category.includes('dna') ? <Beaker size={16} /> : <FlaskConical size={16} />}
            </div>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#00d4ff", textTransform: "uppercase" }}>{ad.company}</div>
          </div>
          
          <h5 style={{ color: "white", fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>{ad.title}</h5>
          <p style={{ color: "#64748b", fontSize: "0.8rem", lineHeight: 1.5, margin: 0 }}>{ad.description}</p>
          
          <a 
            href={ad.link} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              marginTop: "0.5rem",
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              gap: "0.5rem",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "white",
              padding: "0.6rem",
              borderRadius: "10px",
              fontSize: "0.75rem",
              fontWeight: 700,
              textDecoration: "none",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"; }}
          >
            Learn More <ExternalLink size={12} />
          </a>
        </motion.div>
      ))}

      {/* Featured Kit Ad - Tall */}
      <div style={{ 
        marginTop: "auto",
        background: "linear-gradient(180deg, rgba(124, 58, 237, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)",
        borderRadius: "20px",
        border: "1px solid rgba(124, 58, 237, 0.2)",
        padding: "1.5rem",
        textAlign: "center"
      }}>
        <ShieldCheck size={32} color="#7c3aed" style={{ margin: "0 auto 1rem" }} />
        <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", marginBottom: "0.5rem" }}>Certified Supplier</div>
        <h5 style={{ color: "white", fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.75rem" }}>Molecular Grade Reagents</h5>
        <p style={{ color: "#94a3b8", fontSize: "0.8rem", marginBottom: "1.25rem" }}>Trusted by 2,500+ labs worldwide for clinical validation.</p>
        <button style={{ 
          width: "100%", 
          background: "#7c3aed", 
          color: "white", 
          border: "none", 
          padding: "0.8rem", 
          borderRadius: "12px", 
          fontWeight: 700, 
          fontSize: "0.8rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem"
        }}>
          <ShoppingCart size={14} /> Shop Inventory
        </button>
      </div>
    </aside>
  );
}
