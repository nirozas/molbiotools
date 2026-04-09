"use client";

import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Bug, 
  Wrench, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Settings,
  Database,
  Users,
  Terminal,
  LogOut,
  Mail,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Navbar from "@/components/Navbar";

const API_BASE = "http://localhost:3001/api";
const ADMIN_EMAILS = ["asniroz@gmail.com", "nirozzas@gmail.com"];

interface BugReport {
  id: number;
  email: string;
  description: string;
  status: 'pending' | 'resolved';
  timestamp: string;
  platform: string;
  resolvedAt?: string;
}

export default function AdminPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'bugs' | 'tools'>('overview');

  useEffect(() => {
    const savedEmail = localStorage.getItem("admin_email");
    if (savedEmail && ADMIN_EMAILS.includes(savedEmail)) {
      setIsAuthorized(true);
      fetchBugs(savedEmail);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchBugs = async (email?: string) => {
    setLoading(true);
    const authEmail = email || localStorage.getItem("admin_email");
    if (!authEmail) return;

    try {
      const res = await axios.get(`${API_BASE}/admin/bugs`, {
        headers: { 'x-admin-email': authEmail }
      });
      setBugs(res.data);
    } catch (err) {
      console.error("Failed to fetch bugs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (ADMIN_EMAILS.includes(emailInput)) {
      localStorage.setItem("admin_email", emailInput);
      setIsAuthorized(true);
      fetchBugs(emailInput);
    } else {
      alert("Access Denied: Unauthorized email.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_email");
    setIsAuthorized(false);
  };

  const resolveBug = async (id: number) => {
    const authEmail = localStorage.getItem("admin_email");
    try {
      await axios.post(`${API_BASE}/admin/resolve-bug`, { id }, {
        headers: { 'x-admin-email': authEmail }
      });
      setBugs(prev => prev.map(b => b.id === id ? { ...b, status: 'resolved', resolvedAt: new Date().toISOString() } : b));
    } catch (err) {
      alert("Failed to resolve bug");
    }
  };

  const deleteBug = async (id: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this bug report?")) return;
    const authEmail = localStorage.getItem("admin_email");
    try {
      await axios.post(`${API_BASE}/admin/delete-bug`, { id }, {
        headers: { 'x-admin-email': authEmail }
      });
      setBugs(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      alert("Failed to delete bug");
    }
  };

  if (!isAuthorized) {
    return (
      <div style={{ minHeight: "100vh", background: "#030712", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ width: "100%", maxWidth: "420px", background: "#0a1226", borderRadius: "32px", border: "1px solid rgba(0, 212, 255, 0.1)", padding: "3rem", textAlign: "center", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
        >
          <div style={{ width: "64px", height: "64px", background: "rgba(0, 212, 255, 0.1)", border: "1px solid rgba(0, 212, 255, 0.2)", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <Shield size={32} color="#00d4ff" />
          </div>
          <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.75rem", fontWeight: 800, color: "white", marginBottom: "0.5rem" }}>Admin Portal</h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "2rem" }}>Strictly Restricted Access. Please verify your identity.</p>
          
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
              <input 
                type="email" 
                placeholder="Admin Email Address" 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                style={{ width: "100%", padding: "1rem 1rem 1rem 3rem", background: "#030712", border: "1px solid rgba(148, 163, 184, 0.1)", borderRadius: "14px", color: "white", outline: "none", fontSize: "0.95rem" }}
              />
            </div>
            <button type="submit" style={{ width: "100%", padding: "1rem", background: "linear-gradient(135deg, #00d4ff, #7c3aed)", color: "white", border: "none", borderRadius: "14px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
              <Lock size={18} />
              Verify Access
            </button>
          </form>
          
          <a href="/" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "2rem", color: "#475569", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>
            <ArrowLeft size={14} /> Back to Homepage
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#030712" }}>
      <Navbar />
      
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "6rem 1.5rem 4rem" }}>
        
        <header style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "2rem", marginBottom: "3rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#00d4ff", fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
              <Shield size={14} />
              Administrative Dashboard
            </div>
            <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2.5rem", fontWeight: 800, color: "white" }}>Control <span className="gradient-text">Center</span></h1>
          </div>
          
          <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.75rem 1.25rem", background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.2)", borderRadius: "12px", color: "#f43f5e", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}>
            <LogOut size={16} /> Logout
          </button>
        </header>

        {/* Top Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
          {[
            { label: "Pending Bugs", value: bugs.filter(b => b.status === "pending").length, icon: <Bug size={20} />, color: "#f43f5e" },
            { label: "Resolved Issues", value: bugs.filter(b => b.status === "resolved").length, icon: <CheckCircle size={20} />, color: "#10b981" },
            { label: "Active Connections", value: "1", icon: <Terminal size={20} />, color: "#00d4ff" },
            { label: "System Health", value: "Optimal", icon: <Settings size={20} />, color: "#f59e0b" },
          ].map((stat, i) => (
            <motion.div key={i} whileHover={{ y: -5 }} style={{ background: "#0a1226", border: "1px solid rgba(148, 163, 184, 0.08)", borderRadius: "20px", padding: "1.5rem", display: "flex", alignItems: "center", gap: "1.25rem" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: `${stat.color}15`, border: `1px solid ${stat.color}30`, display: "flex", alignItems: "center", justifyContent: "center", color: stat.color }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600, textTransform: "uppercase" }}>{stat.label}</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "white" }}>{stat.value}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Content Section */}
        <section style={{ background: "#0a1226", border: "1px solid rgba(148, 163, 184, 0.08)", borderRadius: "24px", overflow: "hidden" }}>
          <div style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.08)", padding: "0 1.5rem", display: "flex", gap: "2rem" }}>
            {[
              { id: 'overview', label: 'System Overview', icon: <Database size={16} /> },
              { id: 'bugs', label: 'Bug Reports', icon: <Bug size={16} /> },
              { id: 'tools', label: 'Tool Submissions', icon: <Settings size={16} /> },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{ padding: "1.5rem 0.5rem", background: "none", border: "none", color: activeTab === tab.id ? "#00d4ff" : "#475569", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.6rem", position: "relative", transition: "color 0.2s" }}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && <motion.div layoutId="tab-underline" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", background: "#00d4ff" }} />}
              </button>
            ))}
          </div>

          <div style={{ padding: "2rem" }}>
            {activeTab === 'bugs' ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {bugs.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "4rem", color: "#475569" }}>No bug reports found.</div>
                ) : (
                  bugs.map(bug => (
                    <div key={bug.id} style={{ background: "rgba(3, 7, 18, 0.4)", borderRadius: "16px", padding: "1.5rem", border: `1px solid ${bug.status === 'resolved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)'}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1.5rem" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.65rem", fontWeight: 900, background: bug.status === 'resolved' ? "rgba(16, 185, 129, 0.1)" : "rgba(244, 63, 94, 0.1)", color: bug.status === 'resolved' ? "#10b981" : "#f43f5e", padding: "0.25rem 0.6rem", borderRadius: "6px", textTransform: "uppercase" }}>{bug.status}</span>
                          <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600 }}>ID: {bug.id} · Reported: {new Date(bug.timestamp).toLocaleString()}{bug.status === 'resolved' && bug.resolvedAt ? ` · Resolved: ${new Date(bug.resolvedAt).toLocaleString()}` : ''}</span>
                        </div>
                        <p style={{ color: "#cbd5e1", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "0.5rem" }}>{bug.description}</p>
                        <div style={{ fontSize: "0.8rem", color: "#475569", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Mail size={12} /> {bug.email} · <Terminal size={12} /> {bug.platform}
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {bug.status === 'pending' && (
                          <button 
                            onClick={() => resolveBug(bug.id)}
                            style={{ padding: "0.6rem 1rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "10px", color: "#10b981", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                          >
                            Resolve
                          </button>
                        )}
                        <button 
                          onClick={() => deleteBug(bug.id)}
                          style={{ padding: "0.6rem 1rem", background: "rgba(244, 63, 94, 0.05)", border: "1px solid rgba(244, 63, 94, 0.15)", borderRadius: "10px", color: "#f43f5e", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "6rem", background: "rgba(3, 7, 18, 0.2)", borderRadius: "24px", border: "1px dashed rgba(148,163,184,0.1)" }}>
                <div style={{ width: "48px", height: "48px", background: "rgba(148, 163, 184, 0.05)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", color: "#475569" }}>
                   <Terminal size={24} />
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#94a3b8", marginBottom: "0.5rem" }}>{activeTab === 'overview' ? 'System Overview Unavailable' : 'No Submissions Ready'}</h3>
                <p style={{ color: "#475569", fontSize: "0.85rem", maxWidth: "320px", margin: "0 auto" }}>Module integration in progress. Check bug reporting module for live data examples.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
