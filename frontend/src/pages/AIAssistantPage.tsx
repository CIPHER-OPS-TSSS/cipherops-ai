import React, { useState, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  FileText,
  Clock,
  AlertTriangle,
  FolderOpen,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';

export const AIAssistantPage: React.FC = () => {
  const [prompt, setPrompt] = useState('What is the recorded investigation history and evidence for Case CAS-2026-0812?');
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [cases, setCases] = useState<any[]>([]);
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api.getCases().then(res => setCases(res.cases || []));
  }, []);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const res = await api.askAi(prompt, selectedCaseId || undefined);
      setResponse(res);
    } catch (err: any) {
      alert(`AI Assistant Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'What is the recorded investigation history and evidence for Case CAS-2026-0812?',
    'Summarize the timeline and suspect statements for the Chanakyapuri jewel robbery.',
    'Compare the seized die punches in Mayapuri with the hijacked Scorpio in Rohini.',
    'Are there any conflicting timestamps or missing telecom logs across our dockets?',
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-graphite-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Bot className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono">
                CONVERSATIONAL INVESTIGATIVE ASSISTANT
              </h1>
              <p className="text-xs text-slate-400">
                Context-grounded decision support strictly citing official records and document extracts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Case Scope:</span>
          <select
            value={selectedCaseId}
            onChange={e => setSelectedCaseId(e.target.value)}
            className="rounded-lg border border-graphite-700 bg-graphite-900 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="">Global (All Accessible Dockets)</option>
            {cases.map(c => (
              <option key={c.id} value={c.id}>
                {c.caseNumber} — {c.title.slice(0, 28)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Input Box */}
      <form onSubmit={handleAsk} className="rounded-xl border border-graphite-700 bg-graphite-900/90 p-4 shadow-xl space-y-3">
        <div className="relative">
          <textarea
            rows={3}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Ask a factual question about cases, suspect statements, ballistics reports, or timelines..."
            className="w-full rounded-lg border border-graphite-700 bg-graphite-950 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none leading-relaxed"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-3 bottom-3 flex items-center space-x-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-semibold text-graphite-950 transition-colors shadow-md shadow-cyan-900/40"
          >
            <span>{isLoading ? 'Synthesizing Answers...' : 'Inquire Records'}</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Prompt Suggestions */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase mr-1 flex items-center">
            Suggested Prompts:
          </span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(p)}
              className="rounded bg-graphite-950 border border-graphite-800 hover:border-cyan-500/40 px-2 py-0.5 text-[11px] text-slate-300 transition-colors"
            >
              "{p.slice(0, 42)}..."
            </button>
          ))}
        </div>
      </form>

      {/* Structured 7-Section Response Renderer */}
      {response && (
        <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-graphite-800">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-100 font-mono">
                STRUCTURED INVESTIGATIVE SYNTHESIS
              </h2>
            </div>
            <span className="rounded bg-emerald-950 border border-emerald-800 text-emerald-300 px-2 py-0.5 text-[10px] font-mono">
              100% Grounded in Official Records
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* 1. Summary */}
            <div className="rounded-lg bg-graphite-950 p-4 border border-graphite-800">
              <h3 className="font-mono text-xs font-bold uppercase text-cyan-400 mb-1.5">
                1. Executive Summary
              </h3>
              <p className="text-slate-200 leading-relaxed text-sm font-sans">{response.summary}</p>
            </div>

            {/* 2. Documented Facts */}
            <div className="rounded-lg bg-graphite-950 p-4 border border-graphite-800">
              <h3 className="font-mono text-xs font-bold uppercase text-emerald-400 mb-2">
                2. Documented Official Facts
              </h3>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300 leading-relaxed">
                {response.documentedFacts?.map((fact: string, idx: number) => (
                  <li key={idx}>{fact}</li>
                ))}
              </ul>
            </div>

            {/* 3. Relevant Timeline */}
            {response.relevantTimeline?.length > 0 && (
              <div className="rounded-lg bg-graphite-950 p-4 border border-graphite-800">
                <h3 className="font-mono text-xs font-bold uppercase text-blue-400 mb-2">
                  3. Relevant Chronological Milestones
                </h3>
                <div className="space-y-2">
                  {response.relevantTimeline.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-start space-x-3 p-2 rounded bg-graphite-900 border border-graphite-850">
                      <span className="font-mono text-cyan-300 text-[11px] font-semibold whitespace-nowrap">
                        {item.date}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-100">{item.event}</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">{item.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Related Records */}
            {response.relatedRecords?.length > 0 && (
              <div className="rounded-lg bg-graphite-950 p-4 border border-graphite-800">
                <h3 className="font-mono text-xs font-bold uppercase text-purple-400 mb-1.5">
                  4. Referenced Case Dockets & Evidence
                </h3>
                <div className="flex flex-wrap gap-2">
                  {response.relatedRecords.map((rec: string, idx: number) => (
                    <span
                      key={idx}
                      className="rounded bg-graphite-900 border border-graphite-800 px-2.5 py-1 text-slate-200 font-mono text-[11px]"
                    >
                      {rec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 5 & 6. Inconsistencies & Missing Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg bg-graphite-950 p-4 border border-graphite-800">
                <h3 className="font-mono text-xs font-bold uppercase text-amber-400 mb-2 flex items-center space-x-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>5. Potential Inconsistencies & Flags</span>
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  {response.potentialInconsistencies?.map((inc: string, idx: number) => (
                    <li key={idx}>{inc}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg bg-graphite-950 p-4 border border-graphite-800">
                <h3 className="font-mono text-xs font-bold uppercase text-slate-400 mb-2 flex items-center space-x-1.5">
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>6. Pending Missing Information</span>
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  {response.missingInformation?.map((miss: string, idx: number) => (
                    <li key={idx}>{miss}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 7. Citations */}
            {response.citations?.length > 0 && (
              <div className="rounded-lg bg-graphite-950 p-4 border border-cyan-500/20">
                <h3 className="font-mono text-xs font-bold uppercase text-cyan-300 mb-2 flex items-center space-x-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span>7. Supporting Sources & Record Citations</span>
                </h3>
                <div className="space-y-2">
                  {response.citations.map((cit: any, idx: number) => (
                    <div key={idx} className="p-3 rounded bg-graphite-900 border border-graphite-800 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-cyan-400 font-bold">{cit.documentNumber}</span>
                          <span className="text-slate-300 font-semibold">{cit.title}</span>
                          <span className="text-slate-500 font-mono text-[10px]">Page {cit.pageNumber}</span>
                        </div>
                        <p className="text-slate-400 italic text-[11px] mt-1 bg-graphite-950 p-2 rounded border border-graphite-850">
                          "{cit.excerpt}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-graphite-800 text-[10px] text-slate-500 font-mono leading-relaxed">
            {response.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
};
