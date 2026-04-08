"use client";

import React from "react";
import { 
  Heart, 
  Coffee, 
  ChevronRight, 
  CreditCard 
} from "lucide-react";
import { motion } from "framer-motion";

export default function DonationSection() {
  return (
    <section style={{ 
      width: "100%", 
      padding: "5rem 1.5rem", 
      background: "linear-gradient(180deg, transparent 0%, rgba(5, 11, 24, 0.4) 100%)",
      textAlign: "center"
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={{ 
            background: "rgba(15, 23, 42, 0.4)", 
            borderRadius: "32px", 
            border: "1px solid rgba(0, 212, 255, 0.1)",
            padding: "3rem 2rem",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {/* Decorative glow */}
          <div style={{ 
            position: "absolute", 
            top: "-50px", 
            right: "-50px", 
            width: "200px", 
            height: "200px", 
            background: "radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)",
            filter: "blur(40px)"
          }} />

          <Heart size={40} color="#ec4899" fill="#ec489915" style={{ margin: "0 auto 1.5rem" }} />
          
          <h2 style={{ 
            fontFamily: "Space Grotesk, sans-serif", 
            fontSize: "2rem", 
            fontWeight: 800, 
            color: "white", 
            marginBottom: "1rem" 
          }}>Support Our Research</h2>
          
          <p style={{ 
            color: "#64748b", 
            fontSize: "1.1rem", 
            lineHeight: 1.6, 
            marginBottom: "2.5rem",
            maxWidth: "600px",
            margin: "0 auto 2.5rem"
          }}>
            This platform is dedicated to providing free, high-performance bioinformatics tools to the global scientific community. Your donations help us cover server costs and continue developing open-source solutions.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1rem" }}>
            <button style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.75rem", 
              background: "#ec4899", 
              color: "white", 
              border: "none", 
              padding: "1rem 2rem", 
              borderRadius: "14px", 
              fontWeight: 700,
              cursor: "pointer",
              transition: "transform 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <Coffee size={20} /> Buy us a coffee
            </button>
            
            <button style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.75rem", 
              background: "rgba(255, 255, 255, 0.05)", 
              border: "1px solid rgba(255, 255, 255, 0.1)", 
              color: "white", 
              padding: "1rem 2rem", 
              borderRadius: "14px", 
              fontWeight: 700,
              cursor: "pointer"
            }}>
              <CreditCard size={20} /> Donate via Card
            </button>
          </div>
          
          <div style={{ marginTop: "2rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "#475569", fontSize: "0.85rem" }}>
            <span style={{ fontWeight: 600 }}>Secure checkout Powered by Stripe</span>
            <ChevronRight size={14} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
