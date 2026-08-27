"use client";

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface MolstarViewerProps {
  accession: string;
  label: string;
}

export default function MolstarViewer({ accession, label }: MolstarViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let instance: any = null;
    let attempts = 0;

    const initViewer = () => {
      if (!viewerRef.current) return;
      
      // Check if library is loaded
      if (typeof window === 'undefined' || !(window as any).PDBeMolstarPlugin) {
        attempts++;
        if (attempts < 20) {
          setTimeout(initViewer, 500); // Wait 500ms and try again
        } else {
          setError("Failed to load 3D viewer library.");
        }
        return;
      }

      viewerRef.current.innerHTML = ""; // Clear any existing canvas
      setError(null);
      
      try {
        instance = new (window as any).PDBeMolstarPlugin();
        
        const options = {
          customData: {
            url: `https://alphafold.ebi.ac.uk/files/AF-${accession}-F1-model_v4.cif`,
            format: 'cif'
          },
          alphafoldView: true,
          bgColor: { r: 15, g: 23, b: 42 }, // Tailwind slate-900
          hideControls: true,
          landscape: true
        };
        
        instance.render(viewerRef.current, options);
      } catch (err) {
        console.error("Error initializing PDBe Molstar:", err);
        setError("Error rendering 3D structure.");
      }
    };

    // Delay init slightly to ensure container is fully mounted in layout
    setTimeout(initViewer, 100);

    return () => {
      if (instance && instance.plugin) {
        try {
          instance.plugin.clear();
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  }, [accession]);

  return (
    <div className="w-full flex flex-col bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-300">{label} Structure (AlphaFold)</h3>
      </div>
      
      <div className="relative w-full aspect-square md:aspect-[4/3] bg-slate-900 flex items-center justify-center">
        {/* CSS for Molstar */}
        <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/pdbe-molstar@3.2.0/build/pdbe-molstar-light.css" />
        {/* JS Script loaded once per page by Next.js */}
        <Script src="https://cdn.jsdelivr.net/npm/pdbe-molstar@3.2.0/build/pdbe-molstar-plugin.js" strategy="lazyOnload" />
        
        {error ? (
          <p className="text-xs text-red-400 p-4 text-center">{error}</p>
        ) : (
          <div ref={viewerRef} className="absolute inset-0 w-full h-full" style={{ position: "relative" }}></div>
        )}
      </div>
    </div>
  );
}
