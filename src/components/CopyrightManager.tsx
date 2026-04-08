"use client";

import React, { useEffect } from "react";

export default function CopyrightManager() {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Allow context menu only on specific allowed elements if needed
      if (!(e.target as HTMLElement).closest(".allow-context")) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+C, Ctrl+U, Ctrl+S
      if (
        (e.ctrlKey && (e.key === "c" || e.key === "u" || e.key === "s" || e.key === "p")) ||
        (e.metaKey && (e.key === "c" || e.key === "u" || e.key === "s" || e.key === "p"))
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null; // Side effect only component
}
