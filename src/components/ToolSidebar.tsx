"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Dna,
  Zap,
  Layers,
  FlaskConical,
  Microscope,
  Calculator,
  Shield,
  Atom,
  ExternalLink,
  Cpu,
  PanelLeftClose,
  PanelLeftOpen,
  Home,
} from "lucide-react";
import Link from "next/link";

/* ─────────────────────────────────────────
   DATA  (mirrors HomePage.tsx categories)
───────────────────────────────────────── */
const SIDEBAR_DATA = [
  {
    id: "dna",
    name: "DNA Tools",
    icon: Dna,
    color: "#00d4ff",
    bg: "rgba(0,212,255,0.08)",
    subcategories: [
      {
        name: "Sequence Analysis",
        tools: [
          { name: "Reverse Complement", href: "#", type: "internal" },
          { name: "GC Content Calculator", href: "#", type: "internal" },
          { name: "Sequence Statistics", href: "#", type: "internal" },
        ],
      },
      {
        name: "Restriction & Cloning",
        tools: [
          { name: "Restriction Enzyme Analyzer", href: "#", type: "internal" },
          { name: "Ligation Calculator", href: "#", type: "internal" },
          { name: "Primer Design (Primer3)", href: "https://primer3.ut.ee/", type: "external" },
        ],
      },
      {
        name: "CRISPR & Editing",
        tools: [
          { name: "CRISPR Guide RNA Designer", href: "https://chopchop.cbu.uib.no/", type: "external" },
          { name: "Off-target Predictor", href: "https://cas-offinder.bioinformatics.kr/", type: "external" },
        ],
      },
      {
        name: "Alignment & BLAST",
        tools: [
          { name: "BLAST (NCBI)", href: "https://blast.ncbi.nlm.nih.gov/", type: "external" },
          { name: "Pairwise Alignment", href: "#", type: "internal" },
        ],
      },
    ],
  },
  {
    id: "rna",
    name: "RNA Tools",
    icon: Zap,
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    subcategories: [
      {
        name: "Transcription",
        tools: [
          { name: "DNA to RNA Transcription", href: "#", type: "internal" },
          { name: "ORF Finder", href: "#", type: "internal" },
          { name: "Codon Usage Table", href: "#", type: "internal" },
        ],
      },
      {
        name: "Structure & Folding",
        tools: [
          { name: "RNA Secondary Structure", href: "http://www.unafold.org/mfold/", type: "external" },
          { name: "miRNA Target Predictor", href: "https://www.targetscan.org/", type: "external" },
        ],
      },
      {
        name: "Non-coding RNA",
        tools: [
          { name: "lncRNA Analysis", href: "#", type: "internal" },
          { name: "siRNA Designer", href: "#", type: "internal" },
        ],
      },
    ],
  },
  {
    id: "protein",
    name: "Protein Tools",
    icon: Layers,
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.08)",
    subcategories: [
      {
        name: "Translation",
        tools: [
          { name: "Protein Translation", href: "/tools/run/translation", type: "internal" },
          { name: "Reverse Translation", href: "/tools/run/rev-trans", type: "internal" },
          { name: "AA Notation Converter", href: "/tools/run/aa-converter", type: "internal" },
          { name: "Protein Property Visualizer", href: "/tools/run/protein-viewer", type: "internal" },
          { name: "Amino Acid Properties", href: "#", type: "internal" },
        ],
      },
      {
        name: "Structure",
        tools: [
          { name: "AlphaFold Structure Viewer", href: "https://alphafold.ebi.ac.uk/", type: "external" },
          { name: "Secondary Structure Prediction", href: "#", type: "external" },
          { name: "Signal Peptide Finder", href: "#", type: "external" },
        ],
      },
      {
        name: "Mutagenesis",
        tools: [
          { name: "AA Silent Switch", href: "/tools/run/aa-silent-switch", type: "internal" },
          { name: "AA Switcher", href: "/tools/run/aa-switcher", type: "internal" },
          { name: "Silent Mutator", href: "#", type: "internal" },
        ],
      },
      {
        name: "Motifs & Domains",
        tools: [
          { name: "Motif Finder", href: "#", type: "internal" },
          { name: "Domain Architecture", href: "https://www.ebi.ac.uk/interpro/", type: "external" },
          { name: "Transmembrane Helix Predictor", href: "#", type: "external" },
        ],
      },
      {
        name: "MHC Peptide Binding",
        tools: [
          { name: "MHC-I Peptide Binder", href: "/mhc", type: "internal", active: true },
          { name: "MHC-II Peptide Binder", href: "/mhc", type: "internal", active: true },
          { name: "Epitope Conservation", href: "#", type: "internal" },
        ],
      },
    ],
  },
  {
    id: "metabolism",
    name: "Metabolism",
    icon: FlaskConical,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    subcategories: [
      {
        name: "Pathway Analysis",
        tools: [
          { name: "KEGG Pathway Viewer", href: "https://www.kegg.jp/kegg/pathway.html", type: "external" },
          { name: "Metabolite Identifier", href: "https://hmdb.ca/", type: "external" },
        ],
      },
      {
        name: "Lab Calculators",
        tools: [
          { name: "Buffer Calculator", href: "#", type: "internal" },
          { name: "Molarity Calculator", href: "#", type: "internal" },
          { name: "OD600 Cell Density", href: "#", type: "internal" },
        ],
      },
      {
        name: "Enzyme Kinetics",
        tools: [
          { name: "Michaelis-Menten Fitter", href: "#", type: "python" },
          { name: "Lineweaver-Burk Plot", href: "#", type: "python" },
        ],
      },
    ],
  },
  {
    id: "genomics",
    name: "Genomics",
    icon: Microscope,
    color: "#f43f5e",
    bg: "rgba(244,63,94,0.08)",
    subcategories: [
      {
        name: "Assembly & Annotation",
        tools: [
          { name: "Gene Prediction (Augustus)", href: "https://bioinf.uni-greifswald.de/augustus/", type: "external" },
          { name: "RepeatMasker Link", href: "https://www.repeatmasker.org/", type: "external" },
        ],
      },
      {
        name: "Comparative Genomics",
        tools: [
          { name: "Synteny Viewer", href: "#", type: "external" },
          { name: "Phylogenetic Tree Builder", href: "http://www.iqtree.org/", type: "external" },
        ],
      },
      {
        name: "Variant Analysis",
        tools: [
          { name: "SNP Annotation", href: "https://www.ensembl.org/Tools/VEP", type: "external" },
          { name: "Population Genetics Stats", href: "#", type: "r" },
        ],
      },
    ],
  },
  {
    id: "calculators",
    name: "Lab Calculators",
    icon: Calculator,
    color: "#6366f1",
    bg: "rgba(99,102,241,0.08)",
    subcategories: [
      {
        name: "Nucleic Acid",
        tools: [
          { name: "DNA Concentration Calculator", href: "#", type: "internal" },
          { name: "Tm Calculator", href: "#", type: "internal" },
        ],
      },
      {
        name: "General Lab",
        tools: [
          { name: "Centrifugation Calculator", href: "#", type: "internal" },
          { name: "Serial Dilution Planner", href: "#", type: "internal" },
          { name: "Unit Converter (Biology)", href: "#", type: "internal" },
        ],
      },
    ],
  },
  {
    id: "immunology",
    name: "Immunology",
    icon: Shield,
    color: "#ec4899",
    bg: "rgba(236,72,153,0.08)",
    subcategories: [
      {
        name: "Epitope Prediction",
        tools: [
          { name: "B-cell Epitope Predictor", href: "#", type: "internal" },
          { name: "T-cell Epitope Predictor", href: "#", type: "internal" },
          { name: "IEDB Analysis (Link)", href: "https://tools.iedb.org/", type: "external" },
        ],
      },
      {
        name: "Antibody Tools",
        tools: [
          { name: "Antibody Humanization", href: "#", type: "external" },
          { name: "VDJ Recombination Analyzer", href: "#", type: "python" },
        ],
      },
    ],
  },
  {
    id: "microbiome",
    name: "Microbiome & Ecology",
    icon: Atom,
    color: "#0d9488",
    bg: "rgba(13,148,136,0.08)",
    subcategories: [
      {
        name: "16S rRNA Analysis",
        tools: [
          { name: "OTU Picker", href: "https://qiime2.org/", type: "external" },
          { name: "Phyloseq Diversity", href: "#", type: "r" },
        ],
      },
      {
        name: "Metagenomics",
        tools: [
          { name: "Kraken2 Taxonomy", href: "https://ccb.jhu.edu/software/kraken2/", type: "external" },
          { name: "Functional Profiling", href: "#", type: "external" },
        ],
      },
    ],
  },
];

const TYPE_COLORS: Record<string, string> = {
  internal: "#00d4ff",
  external: "#64748b",
  python: "#10b981",
  r: "#8b5cf6",
};

/* ─────────────────────────────────────────
   SUB-ITEM: Subcategory row
───────────────────────────────────────── */
function SubcategoryRow({
  sub,
  catColor,
  activePath,
}: {
  sub: (typeof SIDEBAR_DATA)[0]["subcategories"][0];
  catColor: string;
  activePath: string;
}) {
  const [open, setOpen] = useState(
    sub.tools.some((t) => t.href === activePath)
  );

  return (
    <div>
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.1rem 0.5rem",
          borderRadius: "6px",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.background =
            "rgba(255,255,255,0.04)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.background = "none")
        }
      >
        <button
          onClick={() => setOpen((p) => !p)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.4rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <ChevronDown
            size={11}
            style={{
              color: catColor,
              flexShrink: 0,
              transform: open ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </button>
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color: catColor,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            lineHeight: 1.3,
            flex: 1,
            cursor: "default"
          }}
        >
          {sub.name}
        </span>
      </div>

      {open && (
        <div style={{ paddingLeft: "1.1rem", marginTop: "0.1rem" }}>
          {sub.tools.map((tool) => {
            const isActive = tool.href === activePath;
            const isExternal = tool.type === "external";
            return (
              <Link
                key={tool.name}
                href={tool.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.3rem 0.5rem",
                  borderRadius: "6px",
                  textDecoration: "none",
                  marginBottom: "0.05rem",
                  background: isActive
                    ? `${catColor}15`
                    : "transparent",
                  borderLeft: isActive
                    ? `2px solid ${catColor}`
                    : "2px solid transparent",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                }}
              >
                <div
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: isActive
                      ? catColor
                      : TYPE_COLORS[tool.type] || "#475569",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#f0f6ff" : "#64748b",
                    lineHeight: 1.4,
                    flex: 1,
                    transition: "color 0.15s",
                  }}
                >
                  {tool.name}
                </span>
                {isExternal && (
                  <ExternalLink
                    size={9}
                    style={{ color: "#334155", flexShrink: 0 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   CATEGORY ROW
───────────────────────────────────────── */
function CategoryRow({
  cat,
  activePath,
  defaultOpen,
}: {
  cat: (typeof SIDEBAR_DATA)[0];
  activePath: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = cat.icon;

  return (
    <div style={{ marginBottom: "0.25rem" }}>
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "0.2rem",
          padding: "0.25rem 0.5rem",
          borderRadius: "10px",
          background: open ? cat.bg : "transparent",
          transition: "all 0.2s ease",
          position: "relative"
        }}
        onMouseEnter={(e) => {
          if (!open)
            (e.currentTarget as HTMLElement).style.background =
              "rgba(255,255,255,0.04)";
        }}
        onMouseLeave={(e) => {
          if (!open)
            (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <Link
          href={`/tools/${cat.id}`}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.25rem 0.25rem",
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: cat.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: `1px solid ${cat.color}25`,
            }}
          >
            <Icon size={14} style={{ color: cat.color }} />
          </div>
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              color: open ? "#f0f6ff" : "#94a3b8",
              flex: 1,
              transition: "color 0.2s",
            }}
          >
            {cat.name}
          </span>
        </Link>
        <button
          onClick={() => setOpen((p) => !p)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            borderRadius: "6px",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <ChevronRight
            size={13}
            style={{
              color: cat.color,
              transform: open ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </button>
      </div>

      {open && (
        <div
          style={{
            paddingLeft: "0.75rem",
            paddingRight: "0.25rem",
            paddingTop: "0.25rem",
            paddingBottom: "0.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.1rem",
          }}
        >
          {cat.subcategories.map((sub) => (
            <SubcategoryRow
              key={sub.name}
              sub={sub}
              catColor={cat.color}
              activePath={activePath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN SIDEBAR COMPONENT
───────────────────────────────────────── */
export default function ToolSidebar({
  activePath,
  collapsed,
  onToggle,
}: {
  activePath: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  // Auto-open the category containing the active tool
  const activeCatId =
    SIDEBAR_DATA.find((cat) =>
      cat.subcategories.some((s) => s.tools.some((t) => t.href === activePath))
    )?.id ?? null;

  return (
    <aside
      style={{
        width: collapsed ? "56px" : "260px",
        minWidth: collapsed ? "56px" : "260px",
        height: "calc(100vh - 64px)",
        position: "sticky",
        top: "64px",
        background: "rgba(5,11,24,0.95)",
        borderRight: "1px solid rgba(148,163,184,0.07)",
        backdropFilter: "blur(20px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)",
        flexShrink: 0,
        zIndex: 50,
      }}
    >
      {/* Top Controls */}
      <div
        style={{
          padding: collapsed ? "0.75rem 0" : "0.75rem 0.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          borderBottom: "1px solid rgba(148,163,184,0.07)",
          gap: "0.5rem",
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#334155",
            }}
          >
            Tool Navigator
          </span>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(148,163,184,0.1)",
            borderRadius: "8px",
            color: "#475569",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#00d4ff";
            (e.currentTarget as HTMLElement).style.borderColor =
              "rgba(0,212,255,0.3)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#475569";
            (e.currentTarget as HTMLElement).style.borderColor =
              "rgba(148,163,184,0.1)";
          }}
        >
          {collapsed ? (
            <PanelLeftOpen size={15} />
          ) : (
            <PanelLeftClose size={15} />
          )}
        </button>
      </div>

      {/* Home Button */}
      <div
        style={{
          padding: collapsed ? "0.5rem 0" : "0.5rem 0.75rem",
          borderBottom: "1px solid rgba(148,163,184,0.07)",
          flexShrink: 0,
          display: "flex",
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <Link
          href="/"
          title="Back to Home"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: collapsed ? "0.5rem" : "0.5rem 0.75rem",
            borderRadius: "8px",
            textDecoration: "none",
            background: "rgba(0,212,255,0.06)",
            border: "1px solid rgba(0,212,255,0.15)",
            color: "#00d4ff",
            fontSize: "0.8rem",
            fontWeight: 600,
            transition: "all 0.2s ease",
            width: collapsed ? "36px" : "100%",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "rgba(0,212,255,0.12)";
            (e.currentTarget as HTMLElement).style.borderColor =
              "rgba(0,212,255,0.35)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "rgba(0,212,255,0.06)";
            (e.currentTarget as HTMLElement).style.borderColor =
              "rgba(0,212,255,0.15)";
          }}
        >
          <Home size={14} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Home</span>}
        </Link>
      </div>

      {/* Category Tree — only shown when expanded */}
      {!collapsed && (
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0.5rem 0.5rem",
          }}
          className="no-scrollbar"
        >
          {SIDEBAR_DATA.map((cat) => (
            <CategoryRow
              key={cat.id}
              cat={cat}
              activePath={activePath}
              defaultOpen={cat.id === activeCatId}
            />
          ))}
        </div>
      )}

      {/* Collapsed: show icon-only category icons */}
      {collapsed && (
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.5rem 0",
          }}
          className="no-scrollbar"
        >
          {SIDEBAR_DATA.map((cat) => {
            const Icon = cat.icon;
            const isActive = cat.id === activeCatId;
            return (
              <div
                key={cat.id}
                title={cat.name}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: isActive ? cat.bg : "transparent",
                  border: isActive ? `1px solid ${cat.color}30` : "1px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = cat.bg;
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <Icon size={15} style={{ color: cat.color }} />
              </div>
            );
          })}
        </div>
      )}

      {/* Legend strip */}
      {!collapsed && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderTop: "1px solid rgba(148,163,184,0.07)",
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          {Object.entries({ "Built-in": "#00d4ff", External: "#64748b", Python: "#10b981", R: "#8b5cf6" }).map(
            ([label, color]) => (
              <div
                key={label}
                style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}
              >
                <div
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "0.65rem", color: "#334155", fontWeight: 600 }}>
                  {label}
                </span>
              </div>
            )
          )}
        </div>
      )}
    </aside>
  );
}
