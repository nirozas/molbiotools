"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { categories } from "@/data/categories";
import Navbar from "@/components/Navbar";
import ToolPageLayout from "@/components/ToolPageLayout";
import { 
  ChevronRight, 
  Search, 
  ExternalLink, 
  Cpu, 
  ArrowLeft,
  ArrowRight,
  Filter,
  LayoutGrid,
  List as ListIcon,
  Heart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DonationSection from "@/components/DonationSection";

export default function CategoryToolPage() {
  const { categoryId } = useParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const category = useMemo(() => 
    categories.find(c => c.id === categoryId), 
    [categoryId]
  );

  if (!category) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6">
        <div style={{ textAlign: "center" }}>
          <h1 style={{ color: "white", fontSize: "2rem", marginBottom: "1rem" }}>Category Not Found</h1>
          <button onClick={() => router.push("/")} className="btn-primary">Return Home</button>
        </div>
      </div>
    );
  }

  // Filter tools based on search
  const filteredSubcategories = category.subcategories.map(sub => ({
    ...sub,
    tools: sub.tools.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(sub => sub.tools.length > 0);

  const themeColor = `var(--cat-color)`;

  return (
    <div className="min-h-screen bg-[#030712] selection:bg-cyan-500/30">
      <Navbar />
      
      {/* Dynamic Style Injection for Category Colors */}
      <style>{`
        :root {
          --cat-color: ${categoryId === 'dna' ? '#00d4ff' : 
                         categoryId === 'rna' ? '#10b981' : 
                         categoryId === 'protein' ? '#8b5cf6' : 
                         categoryId === 'metabolism' ? '#f59e0b' : 
                         categoryId === 'genomics' ? '#ec4899' : 
                         categoryId === 'calculators' ? '#6366f1' : 
                         categoryId === 'immunology' ? '#f43f5e' : '#00d4ff'};
          --cat-bg: color-mix(in srgb, var(--cat-color) 8%, transparent);
        }
      `}</style>
      
      <div style={{ height: "64px", flexShrink: 0 }} />
      <ToolPageLayout>
        <main style={{ maxWidth: "100%", margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>
          {/* Header Section */}
          <div style={{ marginBottom: "3rem" }}>
          <button 
            onClick={() => router.push("/")}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem", 
              color: "#64748b", 
              background: "none", 
              border: "none", 
              cursor: "pointer", 
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "1.5rem",
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = themeColor)}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
          >
            <ArrowLeft size={16} /> Back to Hub
          </button>

          <div style={{ display: "flex", alignItems: "flex-end", gap: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ 
              width: "64px", 
              height: "64px", 
              borderRadius: "18px", 
              background: "var(--cat-bg)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              border: "1px solid color-mix(in srgb, var(--cat-color) 20%, transparent)"
            }}>
              {category.icon}
            </div>
            <div>
              <h1 style={{ 
                fontFamily: "Space Grotesk, sans-serif", 
                fontSize: "2.5rem", 
                fontWeight: 800, 
                color: "#f0f6ff",
                lineHeight: 1,
                marginBottom: "0.5rem"
              }}>{category.name}</h1>
              <p style={{ color: "#64748b", fontSize: "1rem" }}>{category.description}</p>
            </div>
          </div>

          {/* Search & Sort Row */}
          <div style={{ 
            display: "flex", 
            gap: "1rem", 
            alignItems: "center", 
            background: "rgba(15, 23, 42, 0.4)", 
            padding: "1rem", 
            borderRadius: "16px",
            border: "1px solid rgba(148, 163, 184, 0.08)"
          }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
              <input 
                type="text" 
                placeholder={`Search ${category.name}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  width: "100%", 
                  background: "rgba(3, 7, 18, 0.5)", 
                  border: "1px solid rgba(148, 163, 184, 0.1)", 
                  padding: "0.75rem 1rem 0.75rem 3rem",
                  borderRadius: "12px",
                  color: "white",
                  outline: "none"
                }}
              />
            </div>
            
            <div style={{ display: "flex", gap: "0.5rem", background: "rgba(3, 7, 18, 0.5)", padding: "0.35rem", borderRadius: "10px", border: "1px solid rgba(148, 163, 184, 0.1)" }}>
              <button 
                onClick={() => setViewMode("grid")}
                style={{ 
                  padding: "0.5rem", 
                  borderRadius: "8px", 
                  background: viewMode === "grid" ? "var(--cat-bg)" : "transparent",
                  color: viewMode === "grid" ? "var(--cat-color)" : "#475569",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode("list")}
                style={{ 
                  padding: "0.5rem", 
                  borderRadius: "8px", 
                  background: viewMode === "list" ? "var(--cat-bg)" : "transparent",
                  color: viewMode === "list" ? "var(--cat-color)" : "#475569",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                <ListIcon size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Tools Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>
          {filteredSubcategories.map((sub) => (
            <section key={sub.name}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                <h2 style={{ 
                  fontSize: "1.25rem", 
                  fontWeight: 800, 
                  color: "#e2e8f0", 
                  textTransform: "uppercase", 
                  letterSpacing: "0.1em" 
                }}>{sub.name}</h2>
                <div style={{ flex: 1, height: "1px", background: "rgba(148, 163, 184, 0.08)" }} />
                <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 700 }}>{sub.tools.length} AVAILABLE</span>
              </div>

              <div style={{ 
                display: "grid", 
                gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(320px, 1fr))" : "1fr",
                gap: "1.5rem" 
              }}>
                {sub.tools.map((tool) => (
                  <motion.div
                    key={tool.name}
                    whileHover={{ y: -4 }}
                    style={{ 
                      background: "rgba(15, 23, 42, 0.3)", 
                      border: "1px solid rgba(148, 163, 184, 0.1)", 
                      borderRadius: "20px",
                      padding: "1.5rem",
                      position: "relative",
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--cat-color)";
                      e.currentTarget.style.background = "rgba(15, 23, 42, 0.5)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.1)";
                      e.currentTarget.style.background = "rgba(15, 23, 42, 0.3)";
                    }}
                    onClick={() => {
                        if (tool.type === 'external' && tool.href) {
                            window.open(tool.href, '_blank');
                        } else if (tool.href) {
                            router.push(tool.href);
                        }
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                      <div style={{ 
                        width: "42px", 
                        height: "42px", 
                        borderRadius: "12px", 
                        background: tool.type === 'internal' ? 'rgba(0, 212, 255, 0.08)' : 'rgba(148, 163, 184, 0.05)',
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: tool.type === 'internal' ? '#00d4ff' : '#475569'
                      }}>
                        {tool.type === 'internal' ? <Cpu size={20} /> : <ExternalLink size={20} />}
                      </div>
                      {tool.badge && (
                        <span style={{ 
                          fontSize: "0.65rem", 
                          fontWeight: 800, 
                          color: "#00d4ff", 
                          background: "rgba(0, 212, 255, 0.1)", 
                          padding: "0.25rem 0.6rem", 
                          borderRadius: "12px",
                          letterSpacing: "0.05em",
                          height: "fit-content"
                        }}>{tool.badge}</span>
                      )}
                    </div>

                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f0f6ff", marginBottom: "0.5rem" }}>{tool.name}</h3>
                    <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.6, marginBottom: "1.5rem" }}>{tool.description}</p>
                    
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      paddingTop: "1rem", 
                      borderTop: "1px solid rgba(148, 163, 184, 0.05)" 
                    }}>
                      <span style={{ 
                        fontSize: "0.65rem", 
                        fontWeight: 700, 
                        color: tool.type === 'internal' ? "#00d4ff" : "#475569",
                        textTransform: "uppercase"
                      }}>{tool.type === 'internal' ? "Built-in Browser App" : "External Resource"}</span>
                      <ArrowRight size={14} color="var(--cat-color)" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Empty State */}
        {filteredSubcategories.length === 0 && (
          <div style={{ textAlign: "center", padding: "5rem 0" }}>
            <p style={{ color: "#475569", fontSize: "1rem" }}>No tools found matching your search.</p>
          </div>
        )}
      </main>
      </ToolPageLayout>
      <DonationSection />
    </div>
  );
}
