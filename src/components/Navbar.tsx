"use client";

import { useState, useEffect } from "react";
import { Menu, X, Dna, Shield, Search, Settings, Bug } from "lucide-react";
import BugReportModal from "./BugReportModal";

const navLinks = [
  { label: "DNA Tools", href: "/tools/dna" },
  { label: "RNA Tools", href: "/tools/rna" },
  { label: "Protein Tools", href: "/tools/protein" },
  { label: "Metabolism", href: "/tools/metabolism" },
  { label: "Genomics", href: "/tools/genomics" },
  { label: "Immunology", href: "/tools/immunology" },
  { label: "About", href: "/about" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bugOpen, setBugOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className="navbar"
      style={{
        boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.4)" : "none",
        transition: "box-shadow 0.3s ease",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
        }}
      >
        {/* Logo */}
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #00d4ff, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Dna size={20} color="white" />
          </div>
          <div>
            <span
              style={{
                fontFamily: "Space Grotesk, Inter, sans-serif",
                fontWeight: 700,
                fontSize: "1.1rem",
                color: "#f0f6ff",
                letterSpacing: "-0.02em",
              }}
            >
              MolBio
            </span>
            <span
              className="gradient-text"
              style={{
                fontFamily: "Space Grotesk, Inter, sans-serif",
                fontWeight: 700,
                fontSize: "1.1rem",
                letterSpacing: "-0.02em",
              }}
            >
              Tools
            </span>
          </div>
        </a>

        {/* Desktop Nav */}
        <div
          className="hidden md:flex"
          style={{
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                color: "rgba(148,163,184,0.9)",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: 500,
                padding: "0.4rem 0.75rem",
                borderRadius: "8px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.color = "#f0f6ff";
                (e.target as HTMLElement).style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.color = "rgba(148,163,184,0.9)";
                (e.target as HTMLElement).style.background = "transparent";
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Bug Report */}
          <button
            onClick={() => setBugOpen(true)}
            style={{
              background: "rgba(244,63,94,0.05)",
              border: "1px solid rgba(244,63,94,0.15)",
              borderRadius: "8px",
              color: "#f43f5e",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.background = "rgba(244,63,94,0.15)";
              el.style.borderColor = "rgba(244,63,94,0.3)";
              el.style.boxShadow = "0 0 15px rgba(244,63,94,0.2)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.background = "rgba(244,63,94,0.05)";
              el.style.borderColor = "rgba(244,63,94,0.15)";
              el.style.boxShadow = "none";
            }}
          >
            <Bug size={16} />
          </button>

          {/* Search Toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(148,163,184,0.1)",
              borderRadius: "8px",
              color: "#94a3b8",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.background = "rgba(0,212,255,0.1)";
              el.style.borderColor = "rgba(0,212,255,0.3)";
              el.style.color = "#00d4ff";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.background = "rgba(255,255,255,0.05)";
              el.style.borderColor = "rgba(148,163,184,0.1)";
              el.style.color = "#94a3b8";
            }}
          >
            <Search size={16} />
          </button>

          {/* Admin Button */}
          <a
            href="/admin"
            className="admin-badge"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 0.9rem",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "0.8rem",
              fontWeight: 600,
              transition: "all 0.2s ease",
            }}
          >
            <Shield size={14} />
            Admin
          </a>

          {/* Mobile Menu Toggle */}
          <button
            className="flex md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(148,163,184,0.1)",
              borderRadius: "8px",
              color: "#94a3b8",
              width: "36px",
              height: "36px",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {searchOpen && (
        <div
          style={{
            padding: "0 1.5rem 1rem",
            maxWidth: "1400px",
            margin: "0 auto",
          }}
        >
          <input
            autoFocus
            type="text"
            placeholder="Search tools, categories… e.g. 'BLAST', 'reverse complement', 'MHC binding'"
            className="search-input"
            style={{
              width: "100%",
              padding: "0.75rem 1.5rem",
              fontSize: "0.95rem",
            }}
          />
        </div>
      )}

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          style={{
            padding: "0.5rem 1rem 1rem",
            borderTop: "1px solid rgba(148,163,184,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                color: "#94a3b8",
                textDecoration: "none",
                fontSize: "0.95rem",
                fontWeight: 500,
                padding: "0.6rem 0.75rem",
                borderRadius: "8px",
                transition: "all 0.2s ease",
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
      {/* Bug Modal */}
      <BugReportModal isOpen={bugOpen} onClose={() => setBugOpen(false)} />
    </nav>
  );
}
