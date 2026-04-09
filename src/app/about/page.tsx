"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Sparkles, Users, Lightbulb, Heart, Globe, Zap, ArrowRight, Beaker } from "lucide-react";
import dynamic from "next/dynamic";

const MolecularBackground = dynamic(() => import("@/components/MolecularBackground"), {
  ssr: false,
});

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050b18", color: "#f0f6ff" }}>
      <Navbar />
      
      <main style={{ position: "relative", overflow: "hidden" }}>
        <MolecularBackground />
        
        {/* Hero Section */}
        <section style={{ 
          padding: "10rem 1.5rem 6rem", 
          textAlign: "center", 
          position: "relative", 
          zIndex: 1 
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
             <div style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "0.5rem", 
                background: "rgba(0,212,255,0.08)", 
                border: "1px solid rgba(0,212,255,0.2)", 
                borderRadius: "50px", 
                padding: "0.4rem 1.2rem", 
                marginBottom: "2rem", 
                fontSize: "0.8rem", 
                fontWeight: 700, 
                color: "#00d4ff",
                textTransform: "uppercase",
                letterSpacing: "0.1em"
              }}>
                <Lightbulb size={14} />
                The Inspiration
              </div>
              <h1 style={{ 
                fontFamily: "Space Grotesk, sans-serif", 
                fontSize: "clamp(2.5rem, 6vw, 4.5rem)", 
                fontWeight: 800, 
                lineHeight: 1.1, 
                marginBottom: "2rem",
                letterSpacing: "-0.02em"
              }}>
                Unifying the <span className="gradient-text">Fragmented</span> <br />Bioinformatics Landscape
              </h1>
              <p style={{ 
                fontSize: "1.2rem", 
                color: "#94a3b8", 
                maxWidth: "800px", 
                margin: "0 auto", 
                lineHeight: 1.8 
              }}>
                Born from the realization that the greatest barrier to scientific discovery isn't just the complexity of nature, 
                but the technical friction of accessing the tools needed to decode it.
              </p>
          </motion.div>
        </section>

        {/* Story Section */}
        <section style={{ padding: "4rem 1.5rem", maxWidth: "1000px", margin: "0 auto", position: "relative", zIndex: 1 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "4rem" }}>
                <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    style={{ background: "rgba(10, 18, 38, 0.4)", border: "1px solid rgba(148, 163, 184, 0.08)", borderRadius: "32px", padding: "3rem", backdropFilter: "blur(20px)" }}
                >
                    <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2rem", fontWeight: 800, marginBottom: "1.5rem", color: "#f1f5f9" }}>The Struggle of the Modern Researcher</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", fontSize: "1.05rem", color: "#64748b", lineHeight: 1.8 }}>
                        <p>
                            For a young researcher embarking on a quest within the molecular realms, the journey is often fraught with a paradoxical challenge. In an era of data abundance, the digital tools required for analysis are scattered across a vast, disjointed archipelago of legacy servers, obscure repositories, and unmaintained scripts.
                        </p>
                        <p>
                            The initial spark of inspiration is frequently dampened by hours spent navigating broken links, grappling with incompatible data formats, or deciphering poorly documented code. This technical labor—while necessary—pulls the intellect away from the core pursuit of biological truth.
                        </p>
                        <p>
                            We observed brilliant minds spending more time being "accidental sysadmins" than actual scientists. This fragmented landscape doesn't just slow down progress; it creates an entry barrier that disproportionately affects those without access to large-scale institutional bio-IT support.
                        </p>
                    </div>
                </motion.div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
                    {[
                        { 
                            title: "The Vision", 
                            text: "MolBioTools was envisioned as a sanctuary—a singular, high-performance portal where the most essential algorithms and calculators are refined, visualized, and made instantly accessible.",
                            icon: <Zap size={24} color="#00d4ff" />
                        },
                        { 
                            title: "The Mission", 
                            text: "To democratize bioinformatics by stripping away the technical overhead, allowing researchers to move from hypothesis to insight with unprecedented fluidity.",
                            icon: <Sparkles size={24} color="#7c3aed" />
                        },
                        { 
                            title: "The Community", 
                            text: "We aren't just building a repository; we are fostering a collective. A space where researchers contribute their own bespoke scripts to empower the global scientific community.",
                            icon: <Users size={24} color="#10b981" />
                        }
                    ].map((item, index) => (
                        <motion.div 
                            key={index}
                            whileHover={{ y: -5 }}
                            style={{ background: "rgba(15, 23, 42, 0.3)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "24px", padding: "2rem" }}
                        >
                            <div style={{ width: "48px", height: "48px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
                                {item.icon}
                            </div>
                            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>{item.title}</h3>
                            <p style={{ color: "#475569", fontSize: "0.95rem", lineHeight: 1.6 }}>{item.text}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>

        {/* Call to Action */}
        <section style={{ padding: "6rem 1.5rem 10rem", textAlign: "center" }}>
             <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                style={{ 
                    maxWidth: "800px", 
                    margin: "0 auto", 
                    padding: "4rem 3rem", 
                    background: "linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(124, 58, 237, 0.1))",
                    border: "1px solid rgba(0, 212, 255, 0.2)",
                    borderRadius: "40px",
                    position: "relative",
                    overflow: "hidden"
                }}
             >
                <div style={{ position: "relative", zIndex: 1 }}>
                    <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1rem" }}>Join the Collective</h2>
                    <p style={{ color: "#94a3b8", marginBottom: "2.5rem", fontSize: "1.1rem" }}>
                        The future of bioinformatics is collaborative. Whether you have a simple script or a complex algorithm, your contribution can be the missing piece for another researcher's breakthrough.
                    </p>
                    <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                        <a href="/submit" className="btn-primary" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            Submit a Tool <ArrowRight size={18} />
                        </a>
                        <a href="/" className="btn-secondary" style={{ textDecoration: "none" }}>
                            Explore Tools
                        </a>
                    </div>
                </div>
             </motion.div>
        </section>

        <footer style={{ padding: "4rem 1.5rem", textAlign: "center", borderTop: "1px solid rgba(148, 163, 184, 0.08)" }}>
             <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "linear-gradient(135deg, #00d4ff, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Dna size={14} color="white" />
                </div>
                <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#94a3b8" }}>MolBioTools project</span>
             </div>
             <p style={{ color: "#334155", fontSize: "0.8rem" }}>© 2024 Built with passion for the global scientific community.</p>
        </footer>
      </main>
    </div>
  );
}
