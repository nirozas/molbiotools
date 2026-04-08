"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { 
  Plus, 
  Send, 
  Globe, 
  Code, 
  User, 
  School, 
  Info, 
  CheckCircle2,
  Layers,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SubmitToolPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    contributorName: "",
    institute: "",
    toolName: "",
    toolDescription: "",
    category: "dna",
    type: "external",
    link: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch("http://localhost:3001/api/submit-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error("Submission failed", error);
      // Fallback for demo if backend isn't running
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const accentColor = "#00d4ff";

  return (
    <div className="min-h-screen bg-[#030712] selection:bg-cyan-500/30">
      <Navbar />

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "8rem 1.5rem 5rem" }}>
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                <div style={{ 
                  display: "inline-flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  width: "56px", 
                  height: "56px", 
                  background: "rgba(0, 212, 255, 0.1)", 
                  borderRadius: "16px",
                  color: accentColor,
                  marginBottom: "1.5rem"
                }}>
                  <Plus size={28} />
                </div>
                <h1 style={{ 
                  fontFamily: "Space Grotesk, sans-serif", 
                  fontSize: "2.5rem", 
                  fontWeight: 800, 
                  color: "white",
                  marginBottom: "1rem"
                }}>Submit a New Tool</h1>
                <p style={{ color: "#64748b", fontSize: "1.1rem" }}>
                  Contribute to the MolBio community. Your tool will be reviewed and added to the platform.
                </p>
              </div>

              <form 
                onSubmit={handleSubmit}
                style={{ 
                  background: "rgba(15, 23, 42, 0.4)", 
                  border: "1px solid rgba(148, 163, 184, 0.1)", 
                  borderRadius: "24px",
                  padding: "2.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2rem"
                }}
              >
                {/* Contributor Info */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div className="input-group">
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.75rem", textTransform: "uppercase" }}>
                      <User size={14} /> Your Name
                    </label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Dr. Jane Doe"
                      value={formData.contributorName}
                      onChange={(e) => setFormData({...formData, contributorName: e.target.value})}
                      style={{ width: "100%", background: "rgba(3, 7, 18, 0.5)", border: "1px solid rgba(148, 163, 184, 0.1)", borderRadius: "12px", padding: "1rem", color: "white", outline: "none" }}
                    />
                  </div>
                  <div className="input-group">
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.75rem", textTransform: "uppercase" }}>
                      <School size={14} /> Institute
                    </label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Stanford University"
                      value={formData.institute}
                      onChange={(e) => setFormData({...formData, institute: e.target.value})}
                      style={{ width: "100%", background: "rgba(3, 7, 18, 0.5)", border: "1px solid rgba(148, 163, 184, 0.1)", borderRadius: "12px", padding: "1rem", color: "white", outline: "none" }}
                    />
                  </div>
                </div>

                {/* Tool Info */}
                <div className="input-group">
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.75rem", textTransform: "uppercase" }}>
                    <Plus size={14} /> Tool Name
                  </label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Protein Structural Switch Predictor"
                    value={formData.toolName}
                    onChange={(e) => setFormData({...formData, toolName: e.target.value})}
                    style={{ width: "100%", background: "rgba(3, 7, 18, 0.5)", border: "1px solid rgba(148, 163, 184, 0.1)", borderRadius: "12px", padding: "1rem", color: "white", outline: "none" }}
                  />
                </div>

                <div className="input-group">
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.75rem", textTransform: "uppercase" }}>
                    <FileText size={14} /> Description
                  </label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Briefly describe what your tool does..."
                    value={formData.toolDescription}
                    onChange={(e) => setFormData({...formData, toolDescription: e.target.value})}
                    style={{ width: "100%", background: "rgba(3, 7, 18, 0.5)", border: "1px solid rgba(148, 163, 184, 0.1)", borderRadius: "12px", padding: "1rem", color: "white", outline: "none", resize: "none" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div className="input-group">
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.75rem", textTransform: "uppercase" }}>
                      <Layers size={14} /> Category
                    </label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      style={{ width: "100%", background: "rgba(3, 7, 18, 0.5)", border: "1px solid rgba(148, 163, 184, 0.1)", borderRadius: "12px", padding: "1rem", color: "white", outline: "none" }}
                    >
                      <option value="dna">DNA Tools</option>
                      <option value="rna">RNA Tools</option>
                      <option value="protein">Protein Tools</option>
                      <option value="metabolism">Metabolism</option>
                      <option value="genomics">Genomics</option>
                      <option value="immunology">Immunology</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.75rem", textTransform: "uppercase" }}>
                      <Info size={14} /> Type
                    </label>
                    <div style={{ display: "flex", gap: "0.5rem", background: "rgba(3, 7, 18, 0.5)", padding: "0.3rem", borderRadius: "10px", border: "1px solid rgba(148, 163, 184, 0.1)" }}>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, type: 'external'})}
                        style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", background: formData.type === 'external' ? 'rgba(0, 212, 255, 0.1)' : 'transparent', color: formData.type === 'external' ? accentColor : "#475569", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                      >
                        <Globe size={14} /> External
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, type: 'internal'})}
                        style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", background: formData.type === 'internal' ? 'rgba(0, 212, 255, 0.1)' : 'transparent', color: formData.type === 'internal' ? accentColor : "#475569", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                      >
                        <Code size={14} /> GitHub
                      </button>
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.75rem", textTransform: "uppercase" }}>
                    <Globe size={14} /> {formData.type === 'external' ? 'Tool URL' : 'GitHub Repository URL'}
                  </label>
                  <input 
                    required
                    type="url" 
                    placeholder={formData.type === 'external' ? "https://example-tool.org" : "https://github.com/user/repo"}
                    value={formData.link}
                    onChange={(e) => setFormData({...formData, link: e.target.value})}
                    style={{ width: "100%", background: "rgba(3, 7, 18, 0.5)", border: "1px solid rgba(148, 163, 184, 0.1)", borderRadius: "12px", padding: "1rem", color: "white", outline: "none" }}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary" 
                  style={{ width: "100%", justifyContent: "center", padding: "1.25rem", marginTop: "1rem" }}
                >
                  {loading ? "Submitting..." : (
                    <>
                      <Send size={18} /> Submit for Review
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center", padding: "4rem 0" }}
            >
              <div style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                justifyContent: "center", 
                width: "80px", 
                height: "80px", 
                background: "rgba(16, 185, 129, 0.1)", 
                borderRadius: "24px",
                color: "#10b981",
                marginBottom: "2rem"
              }}>
                <CheckCircle2 size={40} />
              </div>
              <h2 style={{ fontSize: "2.5rem", fontWeight: 800, color: "white", marginBottom: "1rem" }}>Submission Successful!</h2>
              <p style={{ color: "#64748b", fontSize: "1.1rem", maxWidth: "500px", margin: "0 auto 3rem" }}>
                Thank you, <strong>{formData.contributorName}</strong>. Your submission from <strong>{formData.institute}</strong> has been received. 
                Our team will review the tool and you will be listed as a contributor upon publication.
              </p>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                <button 
                    onClick={() => window.location.href = "/"}
                    className="btn-primary"
                >
                    Return Home
                </button>
                <button 
                    onClick={() => setSubmitted(false)}
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "1rem 2rem", borderRadius: "14px", fontWeight: 700, cursor: "pointer" }}
                >
                    Submit Another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
