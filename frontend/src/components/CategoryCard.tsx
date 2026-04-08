"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Cpu,
  ArrowRight,
} from "lucide-react";

export interface SubTool {
  name: string;
  description: string;
  type: "internal" | "external" | "python" | "r";
  href?: string;
  badge?: string;
}

export interface SubCategory {
  name: string;
  tools: SubTool[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
  subcategories: SubCategory[];
  totalTools: number;
}

const typeConfig = {
  internal: { label: "Built-in", color: "#00d4ff" },
  external: { label: "External", color: "#94a3b8" },
  python: { label: "Python", color: "#10b981" },
  r: { label: "R", color: "#8b5cf6" },
};

export default function CategoryCard({ category }: { category: Category }) {
  const [expanded, setExpanded] = useState(false);
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  return (
    <div
      className={`glass-card category-card-inner ${category.colorClass}`}
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Card Header */}
      <div style={{ padding: "1.5rem" }}>
        {/* Icon + Title Row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
          <div
            className="category-icon-bg"
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {category.icon}
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontFamily: "Space Grotesk, Inter, sans-serif",
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#f0f6ff",
                marginBottom: "0.3rem",
                letterSpacing: "-0.01em",
              }}
            >
              {category.name}
            </h3>
            <p style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.5 }}>
              {category.description}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--cat-color)",
              fontWeight: 600,
              background: "var(--cat-bg)",
              padding: "0.25rem 0.75rem",
              borderRadius: "20px",
              border: "1px solid color-mix(in srgb, var(--cat-color) 20%, transparent)",
            }}
          >
            {category.totalTools} tools
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <a
              href={`/tools/${category.id}`}
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#64748b",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--cat-color)")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#64748b")}
            >
              Show all
            </a>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                background: "none",
                border: "none",
                color: "var(--cat-color)",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                padding: "0.25rem 0",
                transition: "gap 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.gap = "0.55rem";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.gap = "0.35rem";
              }}
            >
              {expanded ? "Collapse" : "Explore"}
              <ChevronDown
                size={14}
                style={{
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Subcategories Panel */}
      <div
        className={`subcategory-list ${expanded ? "expanded" : ""}`}
        style={{
          borderTop: expanded ? "1px solid rgba(148,163,184,0.08)" : "none",
        }}
      >
        <div style={{ padding: "1rem 1.5rem 1.5rem" }}>
          {category.subcategories.map((sub) => (
            <div key={sub.name} style={{ marginBottom: "1.25rem" }}>
              {/* Subcategory header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.6rem",
                }}
              >
                <ChevronRight size={12} style={{ color: "var(--cat-color)", flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--cat-color)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {sub.name}
                </span>
              </div>

              {/* Tools list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {sub.tools.map((tool) => {
                  const typeInfo = typeConfig[tool.type];
                  return (
                    <a
                      key={tool.name}
                      href={tool.href || "#"}
                      className="tool-card"
                      onMouseEnter={() => setHoveredTool(tool.name)}
                      onMouseLeave={() => setHoveredTool(null)}
                      style={{ textDecoration: "none" }}
                    >
                      <div className="sub-tool-dot" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span
                            style={{
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              color: "#e2e8f0",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {tool.name}
                          </span>
                          {tool.badge && (
                            <span
                              style={{
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                background: "rgba(0,212,255,0.1)",
                                color: "#00d4ff",
                                padding: "0.1rem 0.5rem",
                                borderRadius: "10px",
                                flexShrink: 0,
                              }}
                            >
                              {tool.badge}
                            </span>
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: "0.72rem",
                            color: "#475569",
                            marginTop: "0.15rem",
                            lineHeight: 1.4,
                          }}
                        >
                          {tool.description}
                        </p>
                      </div>

                      {/* Type + external icon */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: 600,
                            color: typeInfo.color,
                            background: `${typeInfo.color}1a`,
                            padding: "0.15rem 0.5rem",
                            borderRadius: "8px",
                          }}
                        >
                          {typeInfo.label}
                        </span>
                        {tool.type === "external" ? (
                          <ExternalLink size={12} color="#475569" />
                        ) : (
                          <Cpu size={12} color="#475569" />
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}

          {/* View all link */}
          <a
            href={`#${category.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--cat-color)",
              textDecoration: "none",
              marginTop: "0.5rem",
              transition: "gap 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.gap = "0.65rem";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.gap = "0.4rem";
            }}
          >
            View all {category.name} tools
            <ArrowRight size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}
