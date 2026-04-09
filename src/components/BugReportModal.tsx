"use client";

import React, { useState } from "react";
import { Bug, Send, X, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE = "http://localhost:3001/api";

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BugReportModal({ isOpen, onClose }: BugReportModalProps) {
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await axios.post(`${API_BASE}/report-bug`, {
        email: email || "anonymous",
        description: description.trim(),
        platform: "Web Dashboard"
      });

      setSubmitted(true);
      setDescription("");
      setEmail("");
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error("Error reporting bug:", err);
      setError(err.response?.data?.error || "Failed to submit bug report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "absolute", inset: 0, background: "rgba(3, 7, 18, 0.75)", backdropFilter: "blur(10px)" }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={{ 
                position: "relative", 
                width: "100%", 
                maxWidth: "480px", 
                background: "#0a1226", 
                border: "1px solid rgba(244, 63, 94, 0.2)", 
                borderRadius: "24px", 
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            }}
          >
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg, #f43f5e, #be123c)", padding: "2rem", color: "white", position: "relative" }}>
              <button onClick={onClose} style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", padding: "0.4rem", cursor: "pointer", color: "white" }}>
                <X size={18} />
              </button>
              
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                 <div style={{ background: "rgba(255,255,255,0.2)", padding: "0.5rem", borderRadius: "10px" }}>
                    <Bug size={24} />
                 </div>
                 <h2 style={{ fontSize: "1.25rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>Report a Bug</h2>
              </div>
              <p style={{ fontSize: "0.85rem", opacity: 0.8, fontWeight: 500 }}>Encountered a glitch? Help us improve the platform.</p>
            </div>

            <div style={{ padding: "2rem" }}>
              {submitted ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ width: "64px", height: "64px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                    <CheckCircle2 size={32} />
                  </motion.div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#f1f5f9", marginBottom: "0.5rem" }}>Submission Successful!</h3>
                  <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Thank you. Our engineers have been notified and will investigate shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Your Email (Optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. researcher@lab.edu"
                      style={{ width: "100%", padding: "0.75rem 1rem", background: "rgba(15, 23, 42, 0.4)", border: "1px solid rgba(148,163,184,0.1)", borderRadius: "12px", color: "white", outline: "none", fontSize: "0.9rem" }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Description *</label>
                    <textarea
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what happened, steps to reproduce, or any error messages you saw..."
                      style={{ width: "100%", height: "120px", padding: "0.75rem 1rem", background: "rgba(15, 23, 42, 0.4)", border: "1px solid rgba(148, 163, 184, 0.1)", borderRadius: "12px", color: "white", outline: "none", resize: "none", fontSize: "0.9rem", lineHeight: 1.5 }}
                    />
                  </div>

                  {error && (
                    <div style={{ padding: "0.75rem 1rem", background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.2)", borderRadius: "12px", color: "#f43f5e", fontSize: "0.8rem", fontWeight: 600 }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !description.trim()}
                    style={{ 
                        marginTop: "0.5rem",
                        padding: "1rem", 
                        background: "#f43f5e", 
                        color: "white", 
                        border: "none", 
                        borderRadius: "14px", 
                        fontWeight: 800, 
                        fontSize: "0.9rem", 
                        cursor: loading ? "not-allowed" : "pointer", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        gap: "0.6rem", 
                        transition: "all 0.2s ease",
                        opacity: loading ? 0.7 : 1
                    }}
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Send Bug Report</>}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
