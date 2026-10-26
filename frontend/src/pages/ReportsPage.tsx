import React, { useEffect, useState } from 'react';
import { Download, FileText, CheckCircle2, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('CASE_SUMMARY');
  const [format, setFormat] = useState('PDF');
  const [caseId, setCaseId] = useState('');
  const [cases, setCases] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await api.getReportHistory();
      setHistory(res.history || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
    api.getCases().then(res => setCases(res.cases || []));
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await api.generateReport({
        reportType,
        caseId: caseId || undefined,
        format,
      });

      // Trigger instant simulated download
      const payloadString = JSON.stringify(res.report.downloadPayload || res.report, null, 2);
      const blob = new Blob([payloadString], { type: format === 'CSV' ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${res.report.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${format.toLowerCase()}`;
      a.click();

      fetchHistory();
    } catch (err: any) {
      alert(`Report generation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono flex items-center space-x-2">
          <Download className="h-5 w-5 text-cyan-400" />
          <span>OFFICIAL REPORT GENERATION & DOSSIER EXPORT</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Generate tamper-evident, court-admissible dossiers, evidence logs, and chain-of-custody ledgers.
        </p>
      </div>

      {/* Generator Form */}
      <form onSubmit={handleGenerate} className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-5 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-100 font-mono">EXPORT CONFIGURATION</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Report Classification *</label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value)}
              className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-2 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="CASE_SUMMARY">Case Investigation Summary Dossier</option>
              <option value="EVIDENCE_INVENTORY">Complete Evidence & Exhibits Inventory</option>
              <option value="CHAIN_OF_CUSTODY">Tamper-Evident Chain-of-Custody Report</option>
              <option value="AUDIT_LOG">Security & Access Audit Trail</option>
              <option value="INCIDENT_GEOGRAPHY">Incident Geographical Distribution Report</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Investigation Docket Scope</label>
            <select
              value={caseId}
              onChange={e => setCaseId(e.target.value)}
              className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-2 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="">All Accessible Dockets (Global)</option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} — {c.title.slice(0, 24)}...
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Export Format *</label>
            <select
              value={format}
              onChange={e => setFormat(e.target.value)}
              className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-2 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="PDF">PDF Official Dossier (Formatted)</option>
              <option value="CSV">CSV Tabular Export (Analysis)</option>
              <option value="JSON">JSON Machine-Readable Package</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isGenerating}
            className="flex items-center space-x-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-5 py-2.5 text-xs font-semibold text-graphite-950 transition-colors shadow-lg shadow-cyan-900/40"
          >
            <Download className="h-4 w-4" />
            <span>{isGenerating ? 'Compiling Official Dossier...' : 'Generate & Download Export'}</span>
          </button>
        </div>
      </form>

      {/* History Log */}
      <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-5 shadow-xl space-y-3">
        <h2 className="text-xs font-mono font-semibold uppercase text-slate-400 pb-2 border-b border-graphite-800">
          REPORT GENERATION & EXPORT LOG HISTORY
        </h2>

        <div className="space-y-2">
          {history.map(item => (
            <div
              key={item.id}
              className="p-3.5 rounded-lg border border-graphite-800 bg-graphite-950/60 flex items-center justify-between text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-200">{item.title}</span>
                  <span className="rounded bg-graphite-800 px-1.5 py-0.2 text-[10px] font-mono text-cyan-400">
                    {item.format}
                  </span>
                  <span className="text-emerald-400 text-[10px] font-mono font-bold">COMPLETED</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Generated by: {item.generatedBy} • Records: {item.recordCount} • Size: {item.fileSize}
                </p>
              </div>

              <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
                {new Date(item.generatedAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
