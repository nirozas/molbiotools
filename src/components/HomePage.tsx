"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dna,
  Zap,
  Layers,
  FlaskConical,
  Microscope,
  BarChart3,
  Shield,
  Calculator,
  Search,
  ArrowRight,
  ChevronRight,
  Star,
  Beaker,
  Atom,
  Activity,
  Database,
  Code2,
  Plus,
  Settings,
  HelpCircle,
  X,
  Play,
  MousePointer2,
  Cpu,
  Sparkles,
} from "lucide-react";
import CategoryCard, { Category } from "./CategoryCard";
import Navbar from "./Navbar";
import { categories as categoryData } from "@/data/categories";
import DonationSection from "./DonationSection";

const MolecularBackground = dynamic(() => import("./MolecularBackground"), {
  ssr: false,
});

// ============================================================
//  TOOL CATEGORIES DATA
// ============================================================
const categories = categoryData;

// ============================================================
//  FEATURED TOOLS (hero highlights)
// ============================================================
const featuredTools = [
  { name: "MHC-I & II Peptide Binder", category: "Immunology · AI", href: "/mhc", color: "#8b5cf6" },
  { name: "Reverse Complement", category: "DNA Tools", href: "/tools/run/reverse-complement", color: "#00d4ff" },
  { name: "Protein Translation", category: "Protein Tools", href: "/tools/run/translation", color: "#10b981" },
  { name: "Reverse Translation", category: "Protein Tools", href: "/tools/run/rev-trans", color: "#f59e0b" },
  { name: "Buffer Calculator", category: "Lab Tools", href: "/tools/run/buffer-calculator", color: "#6366f1" },
  { name: "CRISPR Guide RNA", category: "DNA Tools", href: "https://chopchop.cbu.uib.no/", color: "#f43f5e" },
];

// ============================================================
//  STATS
// ============================================================
const stats = [
  { label: "Tools Available", value: "104+", icon: <Beaker size={18} /> },
  { label: "Categories", value: "8", icon: <Database size={18} /> },
  { label: "Built-in Scripts", value: "42", icon: <Code2 size={18} /> },
  { label: "Active Users", value: "1.2K+", icon: <Activity size={18} /> },
];

// ============================================================
//  HOMEPAGE COMPONENT
// ============================================================
export default function HomePage() {
  const [showGuide, setShowGuide] = useState(false);

  const scrollToCategories = () => {
    document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" });
  };

  const guideSteps = [
    {
      title: "1. Select a Category",
      description: "Choose from DNA, RNA, Protein, Metabolism, Genomics, or Lab Calculators.",
      icon: <Layers size={20} color="#00d4ff" />,
    },
    {
      title: "2. Choose Your Tool",
      description: "Explore subcategories to find specialized tools like MHC binders or CRISPR designers.",
      icon: <MousePointer2 size={20} color="#7c3aed" />,
    },
    {
      title: "3. Provide Input",
      description: "Paste your FASTA sequence, DNA string, or experimental parameters into the input fields.",
      icon: <Code2 size={20} color="#10b981" />,
    },
    {
      title: "4. Analyze Results",
      description: "Execute the analysis to view interactive charts, sequences mapping, and detailed reports.",
      icon: <Activity size={20} color="#f59e0b" />,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Navbar />

      {/* ==================== HERO SECTION ==================== */}
      <section
        className="hero-gradient"
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "8rem 1.5rem 5rem",
          overflow: "hidden",
        }}
      >
        {/* Animated molecular background */}
        <MolecularBackground />

        {/* Decorative blobs */}
        <div
          style={{
            position: "absolute",
            top: "15%",
            left: "10%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "20%",
            right: "8%",
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />

        {/* Hero Content */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "860px",
            textAlign: "center",
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.2)",
              borderRadius: "50px",
              padding: "0.4rem 1.2rem",
              marginBottom: "2rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#00d4ff",
              letterSpacing: "0.04em",
            }}
          >
            <Star size={12} fill="#00d4ff" />
            Modern Bioinformatics Platform · 2024
          </div>

          {/* Main Heading */}
          <h1
            style={{
              fontFamily: "Space Grotesk, Inter, sans-serif",
              fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "#f0f6ff",
              marginBottom: "1.5rem",
            }}
          >
            Molecular Biology{" "}
            <span className="gradient-text">Tools</span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
              color: "#64748b",
              lineHeight: 1.7,
              marginBottom: "2.5rem",
              maxWidth: "700px",
              margin: "0 auto 2.5rem",
            }}
          >
            A comprehensive platform for DNA, RNA, protein analysis, metabolomics,
            and immunoinformatics — designed for researchers, educators, and labs.
          </p>

          {/* Search Bar */}
          <div
            style={{
              position: "relative",
              maxWidth: "600px",
              margin: "0 auto 3rem",
            }}
          >
            <Search
              size={20}
              style={{
                position: "absolute",
                left: "1.25rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#475569",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search tools… e.g. 'BLAST', 'reverse complement', 'MHC binding'"
              className="search-input"
              style={{
                width: "100%",
                padding: "1rem 1.5rem 1rem 3.25rem",
                fontSize: "0.95rem",
              }}
            />
          </div>

          {/* CTA Buttons */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: "4rem",
            }}
          >
            <button className="btn-primary" onClick={scrollToCategories}>
              <span style={{ position: "relative", zIndex: 1 }}>Explore All Tools</span>
            </button>
            <button className="btn-secondary" onClick={() => setShowGuide(true)}>
              Quick Start Guide
            </button>
          </div>

          {/* Stats Row */}
          <div
            style={{
              display: "flex",
              gap: "1.5rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {stats.map((s) => (
              <div
                key={s.label}
                style={{
                  textAlign: "center",
                  padding: "0.75rem 1.25rem",
                  background: "rgba(12,22,45,0.6)",
                  border: "1px solid rgba(148,163,184,0.1)",
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.35rem",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div style={{ color: "#00d4ff" }}>{s.icon}</div>
                <div
                  style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: "#f0f6ff",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#475569", fontWeight: 500 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            position: "absolute",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
            color: "#334155",
            fontSize: "0.75rem",
            letterSpacing: "0.1em",
            animation: "float-particle 3s ease-in-out infinite",
          }}
        >
          <span>SCROLL</span>
          <ChevronRight size={16} style={{ transform: "rotate(90deg)" }} />
        </div>
      </section>

      {/* ==================== FEATURED TOOLS STRIP ==================== */}
      <section
        style={{
          background: "rgba(8,15,32,0.8)",
          borderTop: "1px solid rgba(148,163,184,0.06)",
          borderBottom: "1px solid rgba(148,163,184,0.06)",
          padding: "1.5rem 1.5rem",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2rem",
              overflowX: "auto",
              paddingBottom: "0.25rem",
            }}
            className="no-scrollbar"
          >
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#334155",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                flexShrink: 0,
              }}
            >
              Featured
            </span>
            {featuredTools.map((tool) => (
              <a
                key={tool.name}
                href={tool.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  textDecoration: "none",
                  flexShrink: 0,
                  padding: "0.4rem 0.8rem",
                  borderRadius: "8px",
                  border: `1px solid ${tool.color}30`,
                  background: `${tool.color}0a`,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = `${tool.color}15`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${tool.color}50`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = `${tool.color}0a`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${tool.color}30`;
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: tool.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1" }}>
                  {tool.name}
                </span>
                <span style={{ fontSize: "0.7rem", color: "#475569" }}>
                  {tool.category}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CATEGORIES SECTION ==================== */}
      <section
        id="categories"
        style={{
          padding: "6rem 3rem",
          maxWidth: "100%",
          margin: "0 auto",
        }}
      >
        {/* Section Header */}
        <div style={{ marginBottom: "4rem", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#00d4ff",
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "1rem",
              background: "rgba(0,212,255,0.06)",
              padding: "0.4rem 1rem",
              borderRadius: "20px",
              border: "1px solid rgba(0,212,255,0.15)",
            }}
          >
            <BarChart3 size={14} />
            Tool Categories
          </div>
          <h2
            style={{
              fontFamily: "Space Grotesk, Inter, sans-serif",
              fontSize: "clamp(1.8rem, 4vw, 2.75rem)",
              fontWeight: 800,
              color: "#f0f6ff",
              letterSpacing: "-0.02em",
              marginBottom: "1rem",
            }}
          >
            Explore All Toolsets
          </h2>
          <p style={{ color: "#475569", fontSize: "1rem", maxWidth: "560px", margin: "0 auto" }}>
            Click any category to expand its subcategories and tools. Built-in tools run in
            your browser — external tools open in a new tab.
          </p>
        </div>

        {/* Feature Banner: Cloning Viewer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={{
            marginBottom: "3rem",
            background: "linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(124, 58, 237, 0.05))",
            border: "1px solid rgba(0, 212, 255, 0.15)",
            borderRadius: "24px",
            padding: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "2rem",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {/* Shine effect */}
          <div style={{
            position: "absolute",
            top: 0,
            left: "-10%",
            width: "50%",
            height: "100%",
            background: "linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.03), transparent)",
            transform: "skewX(-20deg)",
            pointerEvents: "none"
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flex: 1, minWidth: "300px" }}>
            <div style={{ 
              width: "60px", 
              height: "60px", 
              borderRadius: "16px", 
              background: "rgba(0, 212, 255, 0.1)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              color: "#00d4ff",
              boxShadow: "0 0 20px rgba(0, 212, 255, 0.15)"
            }}>
              <Dna size={32} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#7c3aed", background: "rgba(124, 58, 237, 0.1)", padding: "0.15rem 0.6rem", borderRadius: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Power Tool
                </span>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b" }}>NEW VERSION 1.0</span>
              </div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", marginBottom: "0.4rem" }}>
                Interactive <span className="gradient-text">Cloning Viewer</span> & Sequence Editor
              </h3>
              <p style={{ fontSize: "0.9rem", color: "#64748b", maxWidth: "500px" }}>
                High-performance molecular editor with virtualization support for millions of base pairs. 
                Identify features, manage annotations, and plan experiments.
              </p>
            </div>
          </div>

          <a 
            href="/tools/cloning-viewer"
            className="btn-primary"
            style={{ 
              textDecoration: "none", 
              display: "flex", 
              alignItems: "center", 
              gap: "0.6rem",
              padding: "1rem 2rem",
              borderRadius: "15px",
              boxShadow: "0 10px 20px rgba(0, 212, 255, 0.15)"
            }}
          >
            Open Viewer <ArrowRight size={18} />
          </a>
        </motion.div>

        {/* Category Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(max(320px, calc(33.333% - 1rem)), 1fr))",
            gap: "1.5rem",
          }}
        >
          {categories.map((cat) => (
            <div key={cat.id} id={cat.id}>
              <CategoryCard category={cat} />
            </div>
          ))}
        </div>

        {/* ==================== SUBMIT A TOOL CTA BOX ==================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            marginTop: "4rem",
            position: "relative",
            borderRadius: "32px",
            overflow: "hidden",
            background: "rgba(10, 18, 38, 0.4)",
            border: "1px solid rgba(0, 212, 255, 0.15)",
            padding: "2.5rem 2rem",
            textAlign: "center",
          }}
        >
          {/* Animated background glow */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "120%",
            height: "120%",
            background: "radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, rgba(0, 212, 255, 0.05) 50%, transparent 70%)",
            zIndex: 0,
            pointerEvents: "none"
          }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 212, 255, 0.1)",
                border: "1px solid rgba(0, 212, 255, 0.2)",
                width: "64px",
                height: "64px",
                borderRadius: "20px",
                marginBottom: "1.25rem",
                boxShadow: "0 0 30px rgba(0, 212, 255, 0.15)"
              }}
            >
              <div style={{ position: "relative" }}>
                <FlaskConical size={28} color="#00d4ff" />
                <div style={{
                  position: "absolute",
                  top: "-8px",
                  right: "-8px",
                  background: "#7c3aed",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #0a1226",
                  boxShadow: "0 0 15px rgba(124, 58, 237, 0.5)"
                }}>
                  <Plus size={14} color="white" strokeWidth={3} />
                </div>
              </div>
            </div>

            <h2
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: "2.2rem",
                fontWeight: 800,
                color: "#f0f6ff",
                letterSpacing: "-0.02em",
                marginBottom: "0.75rem",
              }}
            >
              Missing a <span className="gradient-text">Research Tool?</span>
            </h2>

            <p
              style={{
                color: "#94a3b8",
                fontSize: "1rem",
                lineHeight: 1.6,
                maxWidth: "600px",
                margin: "0 auto 2rem",
              }}
            >
              Our platform is community-driven. If you've developed a script, found a 
              useful bio-calculator, or want to integrate a specialized tool, share it 
              with thousands of researchers worldwide.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", flexWrap: "wrap" }}>
              <a href="/submit" 
                className="btn-primary" 
                style={{ 
                  textDecoration: "none", 
                  padding: "1.2rem 2.5rem", 
                  fontSize: "1rem"
                }}
              >
                Submit New Tool
                <ArrowRight size={18} style={{ marginLeft: "0.5rem" }} />
              </a>
              
              <a href="https://github.com/nirozas/molbiotools" 
                target="_blank" 
                rel="noreferrer"
                className="btn-secondary" 
                style={{ 
                  textDecoration: "none", 
                  padding: "1.2rem 2rem", 
                  fontSize: "1rem"
                }}
              >
                <Code2 size={18} style={{ marginRight: "0.5rem" }} />
                Contribute on GitHub
              </a>
            </div>
            
            <div style={{ marginTop: "2rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "2rem", opacity: 0.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#64748b" }}>
                <Zap size={14} color="#f59e0b" />
                <span>Instant Review</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#64748b" }}>
                <Sparkles size={14} color="#00d4ff" />
                <span>AI Distribution</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#64748b" }}>
                <Layers size={14} color="#10b981" />
                <span>Open-Source</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ==================== ADMIN SECTION ==================== */}
      <section
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 1.5rem 6rem",
        }}
      >
        <div className="section-divider" style={{ marginBottom: "4rem" }} />

        <div
          style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(244,63,94,0.06) 100%)",
            border: "1px solid rgba(245,158,11,0.15)",
            borderRadius: "20px",
            padding: "3rem",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "2rem",
          }}
        >
          <div style={{ flex: 1, minWidth: "280px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: "50px",
                padding: "0.3rem 0.9rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#f59e0b",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "1rem",
              }}
            >
              <Shield size={12} />
              Admin Portal
            </div>
            <h3
              style={{
                fontFamily: "Space Grotesk, Inter, sans-serif",
                fontSize: "1.6rem",
                fontWeight: 800,
                color: "#f0f6ff",
                letterSpacing: "-0.02em",
                marginBottom: "0.75rem",
              }}
            >
              Manage Tools & Categories
            </h3>
            <p style={{ color: "#64748b", lineHeight: 1.7, fontSize: "0.95rem" }}>
              Add new tools (built-in scripts, Python/R programs, or external links),
              create and reorder categories, manage subcategories, and control
              tool visibility — all from the admin dashboard.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              minWidth: "220px",
            }}
          >
            {[
              { label: "Add New Tool", icon: <Plus size={14} />, href: "/admin/tools/new" },
              { label: "Manage Categories", icon: <Database size={14} />, href: "/admin/categories" },
              { label: "Admin Dashboard", icon: <Settings size={14} />, href: "/admin" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "10px",
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.2)",
                  color: "#f59e0b",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(245,158,11,0.15)";
                  (e.currentTarget as HTMLElement).style.transform = "translateX(4px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(245,158,11,0.08)";
                  (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
                }}
              >
                {item.icon}
                {item.label}
                <ArrowRight size={13} style={{ marginLeft: "auto" }} />
              </a>
            ))}
          </div>
        </div>
      </section>



      <DonationSection />

      {/* ==================== FOOTER ==================== */}
      <footer
        className="footer-bg"
        style={{
          padding: "3rem 1.5rem 2rem",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
          }}
        >
          {/* Top Row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "3rem",
              justifyContent: "space-between",
              marginBottom: "2.5rem",
            }}
          >
            {/* Brand */}
            <div style={{ maxWidth: "320px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #00d4ff, #7c3aed)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Dna size={18} color="white" />
                </div>
                <span
                  style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontWeight: 700,
                    color: "#f0f6ff",
                    fontSize: "1rem",
                  }}
                >
                  MolBio<span className="gradient-text">Tools</span>
                </span>
              </div>
              <p style={{ color: "#334155", fontSize: "0.85rem", lineHeight: 1.7 }}>
                A modern, open-source platform bringing together the best molecular
                biology tools for researchers, educators, and students worldwide.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 style={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>
                Tools
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {["DNA Tools", "RNA Tools", "Protein Tools", "Metabolism", "Genomics", "Immunology"].map((l) => (
                  <a key={l} href="#" style={{ color: "#475569", textDecoration: "none", fontSize: "0.875rem", transition: "color 0.2s" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#00d4ff")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#475569")}
                  >
                    {l}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>
                Platform
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {["About", "Documentation", "API Reference", "Admin Portal", "Submit a Tool"].map((l) => (
                  <a key={l} href={l === "Submit a Tool" ? "/submit" : "#"} style={{ color: "#475569", textDecoration: "none", fontSize: "0.875rem", transition: "color 0.2s" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#00d4ff")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#475569")}
                  >
                    {l}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="section-divider" style={{ marginBottom: "1.5rem" }} />

          {/* Bottom Row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <p style={{ color: "#1e293b", fontSize: "0.8rem" }}>
              © 2024 Molecular Biology Tools. All data processed locally in your browser.
            </p>
            <p style={{ color: "#1e293b", fontSize: "0.8rem" }}>
              Built with ♥ for the scientific community. Gratitude to <strong>DTU Health Tech</strong> and open-source contributors.
            </p>
          </div>
        </div>
      </footer>

      {/* ==================== QUICK START GUIDE MODAL ==================== */}
      <AnimatePresence>
        {showGuide && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
            }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGuide(false)}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(3, 7, 18, 0.85)",
                backdropFilter: "blur(8px)",
              }}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "600px",
                background: "#0a1226",
                border: "1px solid rgba(148,163,184,0.15)",
                borderRadius: "24px",
                padding: "2.5rem",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              }}
            >
              <button
                onClick={() => setShowGuide(false)}
                style={{
                  position: "absolute",
                  top: "1.5rem",
                  right: "1.5rem",
                  background: "rgba(255,255,255,0.05)",
                  border: "none",
                  borderRadius: "12px",
                  padding: "0.5rem",
                  cursor: "pointer",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} />
              </button>

              <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "48px",
                    height: "48px",
                    background: "rgba(0, 212, 255, 0.1)",
                    borderRadius: "16px",
                    marginBottom: "1rem",
                  }}
                >
                  <HelpCircle size={24} color="#00d4ff" />
                </div>
                <h2
                  style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: "1.75rem",
                    fontWeight: 800,
                    color: "#f0f6ff",
                    marginBottom: "0.5rem",
                  }}
                >
                  Quick Start Guide
                </h2>
                <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
                  Get up and running with the MolBio platform in 4 simple steps
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {guideSteps.map((step, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
                    <div
                      style={{
                        flexShrink: 0,
                        width: "40px",
                        height: "40px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {step.icon}
                    </div>
                    <div>
                      <h4
                        style={{
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "#e2e8f0",
                          marginBottom: "0.25rem",
                        }}
                      >
                        {step.title}
                      </h4>
                      <p style={{ color: "#475569", fontSize: "0.875rem", lineHeight: 1.5 }}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="btn-primary"
                onClick={() => {
                  setShowGuide(false);
                  scrollToCategories();
                }}
                style={{
                  width: "100%",
                  marginTop: "2.5rem",
                  padding: "1rem",
                  justifyContent: "center",
                }}
              >
                <Play size={16} fill="white" />
                Start Exploring Now
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
