"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import ToolSidebar from "./ToolSidebar";
import AdSidebar from "./AdSidebar";

export default function ToolPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div
      style={{
        display: "flex",
        minHeight: "calc(100vh - 64px)",
        background: "#050b18",
        position: "relative",
      }}
    >
      <ToolSidebar
        activePath={pathname}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((p) => !p)}
      />

      {/* Main content area */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flex: 1, width: "100%" }}>
          {children}
        </div>
      </main>

      {/* Ads Column - Hidden on medium screens to preserve tool workspace */}
      <div 
        className="hide-on-mobile"
        style={{ 
          width: "320px", 
          flexShrink: 0,
          borderLeft: "1px solid rgba(148, 163, 184, 0.08)",
          background: "rgba(3, 7, 18, 0.3)",
          display: "block"
        }}
      >
        <AdSidebar currentCategory={pathname.includes('/mhc') ? 'immunology' : pathname.split('/').pop()} />
      </div>

      <style jsx global>{`
        @media (max-width: 1280px) {
          .hide-on-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
