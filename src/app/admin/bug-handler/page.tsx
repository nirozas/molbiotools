import fs from 'fs';
import path from 'path';
import { AlertCircle, Clock, ExternalLink } from 'lucide-react';
import Navbar from '@/components/Navbar';

// Force dynamic rendering so it always reads the latest JSON file on request
export const dynamic = 'force-dynamic';

export default function BugHandlerPage() {
  let reports: any[] = [];
  try {
    const filePath = path.join(process.cwd(), 'data', 'bug-reports.json');
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf-8');
      reports = JSON.parse(fileData);
      // Sort newest first
      reports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  } catch (e) {
    console.error("Failed to read bug reports", e);
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 selection:bg-indigo-500/30 font-sans">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-12 pt-32">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/30 text-red-400">
            <AlertCircle size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Developer Bug Handler</h1>
            <p className="text-slate-400">AI-detected missing tools and user feature requests</p>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-12 text-center">
            <p className="text-slate-400">No bug reports logged yet. You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report: any) => (
              <div key={report.id} className="bg-slate-900 rounded-2xl border border-slate-700/50 p-6 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 block">User Requested:</span>
                    <h3 className="text-lg font-medium text-slate-200">"{report.userPrompt}"</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-full">
                    <Clock size={12} />
                    {new Date(report.timestamp).toLocaleString()}
                  </div>
                </div>

                {report.aiSuggestions && report.aiSuggestions.length > 0 && (
                  <div className="mt-2 border-t border-slate-800/50 pt-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2 block">AI Suggested Workarounds:</span>
                    <div className="flex flex-wrap gap-2">
                      {report.aiSuggestions.map((tool: any, idx: number) => (
                        <a key={idx} href={tool.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm hover:bg-indigo-500/20 transition-colors">
                          {tool.name}
                          <ExternalLink size={12} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
