import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Calendar,
  MapPin,
  Shield,
  Clock,
  User,
  Package,
  FileText,
  Share2,
  Scale,
  Plus,
  Bot,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { Case } from '../types';

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [caseDossier, setCaseDossier] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'persons' | 'evidence' | 'documents' | 'incidents' | 'relationships' | 'court'>('timeline');
  const [isLoading, setIsLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [addTimelineOpen, setAddTimelineOpen] = useState(false);
  const [timelineTitle, setTimelineTitle] = useState('');
  const [timelineDesc, setTimelineDesc] = useState('');
  const [timelineType, setTimelineType] = useState('INVESTIGATOR_NOTE');
  const navigate = useNavigate();

  const fetchDossier = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await api.getCaseById(id);
      setCaseDossier(res.case);
    } catch (err) {
      console.error('Failed to load case dossier:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDossier();
  }, [id]);

  const handleAiSummarize = async () => {
    if (!id) return;
    setAiLoading(true);
    try {
      const res = await api.getCaseSummaryAi(id);
      setAiSummary(res);
    } catch (e: any) {
      alert(`AI Assistant Error: ${e.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await api.addTimelineEvent(id, {
        title: timelineTitle,
        description: timelineDesc,
        eventType: timelineType,
      });
      setAddTimelineOpen(false);
      setTimelineTitle('');
      setTimelineDesc('');
      fetchDossier();
    } catch (err: any) {
      alert(`Failed to add timeline event: ${err.message}`);
    }
  };

  if (isLoading || !caseDossier) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mb-3" />
          <p className="text-xs font-mono text-cyan-400">Loading Case Dossier & Chain of Evidence...</p>
        </div>
      </div>
    );
  }

  const c = caseDossier;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/cases')}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Case Directory</span>
        </button>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAiSummarize}
            disabled={aiLoading}
            className="flex items-center space-x-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 px-3 py-1.5 text-xs font-semibold transition-all shadow-md shadow-cyan-950"
          >
            <Bot className="h-4 w-4 text-cyan-400" />
            <span>{aiLoading ? 'Synthesizing...' : 'AI Dossier Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Case Header Card */}
      <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1.5">
              <span className="font-mono text-xl font-bold text-cyan-400">{c.caseNumber}</span>
              {c.firNumber && (
                <span className="rounded bg-graphite-800 border border-graphite-700 px-2.5 py-0.5 text-xs font-mono text-slate-300 font-semibold">
                  FIR: {c.firNumber}
                </span>
              )}
              <span className="rounded bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 text-xs font-mono">
                {c.status.replace(/_/g, ' ')}
              </span>
              <span className="rounded bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 text-xs font-bold font-mono">
                {c.priority} PRIORITY
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-100">{c.title}</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">{c.description}</p>
          </div>

          <div className="rounded-lg border border-graphite-800 bg-graphite-950/70 p-3 text-xs space-y-1.5 min-w-[220px]">
            <p className="text-slate-400">
              <span className="text-slate-500">Station:</span> {c.policeStation}
            </p>
            <p className="text-slate-400">
              <span className="text-slate-500">Division:</span> {c.jurisdiction}
            </p>
            <p className="text-slate-400">
              <span className="text-slate-500">Investigator:</span>{' '}
              <span className="text-cyan-300 font-medium">
                {c.assignedInvestigator?.fullName || 'Inspector Kabir Sharma'}
              </span>
            </p>
            <p className="text-slate-400">
              <span className="text-slate-500">Reported:</span>{' '}
              {new Date(c.reportedDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Legal Sections */}
        {c.statutorySections?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-graphite-800/80 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono font-semibold text-slate-500 uppercase mr-2">
              Statutory Sections:
            </span>
            {c.statutorySections.map((sec: string, idx: number) => (
              <span
                key={idx}
                className="rounded bg-graphite-800 px-2 py-0.5 text-[11px] font-mono text-cyan-300 border border-graphite-700"
              >
                {sec}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Grounded AI Analysis Result Drawer */}
      {aiSummary && (
        <div className="rounded-xl border border-cyan-500/40 bg-graphite-900/95 p-5 shadow-2xl relative">
          <button
            onClick={() => setAiSummary(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center space-x-2 mb-3">
            <Bot className="h-5 w-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 font-mono">
              CIPHEROPS AI GROUNDED CASE DOSSIER ANALYSIS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3">
              <div className="rounded-lg bg-graphite-950 p-3 border border-graphite-800">
                <p className="text-[11px] font-mono font-semibold uppercase text-cyan-400 mb-1">1. Summary</p>
                <p className="text-slate-300 leading-relaxed">{aiSummary.summary}</p>
              </div>

              <div className="rounded-lg bg-graphite-950 p-3 border border-graphite-800">
                <p className="text-[11px] font-mono font-semibold uppercase text-emerald-400 mb-1">
                  2. Documented Facts
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-300">
                  {aiSummary.documentedFacts?.map((f: string, i: number) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg bg-graphite-950 p-3 border border-graphite-800">
                <p className="text-[11px] font-mono font-semibold uppercase text-amber-400 mb-1">
                  3. Potential Inconsistencies & Flags
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-300">
                  {aiSummary.potentialInconsistencies?.map((inc: string, i: number) => (
                    <li key={i}>{inc}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg bg-graphite-950 p-3 border border-graphite-800">
                <p className="text-[11px] font-mono font-semibold uppercase text-purple-400 mb-1">
                  4. Sources & Citations
                </p>
                <div className="space-y-2">
                  {aiSummary.citations?.map((cit: any, i: number) => (
                    <div key={i} className="p-2 rounded bg-graphite-900 border border-graphite-800">
                      <p className="font-mono text-cyan-300 font-semibold">{cit.documentNumber}: {cit.title}</p>
                      <p className="text-[11px] text-slate-400 italic mt-0.5">"{cit.excerpt}"</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-graphite-950 p-3 border border-graphite-800">
                <p className="text-[11px] font-mono font-semibold uppercase text-blue-400 mb-1">
                  5. Missing Information
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-300">
                  {aiSummary.missingInformation?.map((m: string, i: number) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-graphite-800 text-[10px] text-slate-500 font-mono">
            {aiSummary.disclaimer}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-graphite-800 flex space-x-2 overflow-x-auto pb-1 text-xs font-medium">
        {[
          { key: 'timeline', label: `Timeline (${c.timeline?.length || 0})`, icon: Clock },
          { key: 'persons', label: `Linked Persons (${c.linkedPersons?.length || 0})`, icon: User },
          { key: 'evidence', label: `Evidence Items (${c.linkedEvidence?.length || 0})`, icon: Package },
          { key: 'documents', label: `Documents (${c.linkedDocuments?.length || 0})`, icon: FileText },
          { key: 'incidents', label: `Incidents (${c.linkedIncidents?.length || 0})`, icon: MapPin },
          { key: 'relationships', label: `Connected Cases (${c.relationships?.length || 0})`, icon: Share2 },
          { key: 'court', label: `Court References (${c.courtProceedings?.length || 0})`, icon: Scale },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-graphite-900 border-t border-x border-graphite-800 text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-5 shadow-xl min-h-[300px]">
        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-graphite-800">
              <h3 className="text-xs font-bold text-slate-200 font-mono">
                CHRONOLOGICAL INVESTIGATIVE TRAJECTORY
              </h3>
              <button
                onClick={() => setAddTimelineOpen(true)}
                className="flex items-center space-x-1.5 rounded bg-graphite-800 hover:bg-graphite-700 px-2.5 py-1 text-xs text-cyan-300 font-medium transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Log Progress Event</span>
              </button>
            </div>

            <div className="relative pl-6 border-l-2 border-graphite-800 space-y-6">
              {c.timeline?.map((evt: any) => (
                <div key={evt.id} className="relative group">
                  <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 border-cyan-400 bg-graphite-950" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[11px] text-cyan-400 font-semibold">
                        {new Date(evt.timestamp).toLocaleString()}
                      </span>
                      <span className="rounded bg-graphite-800 px-1.5 py-0.2 text-[9px] font-mono text-slate-400">
                        {evt.eventType}
                      </span>
                      {evt.isVerified && (
                        <span title="Verified Record">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-100 mt-0.5">{evt.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{evt.description}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">Logged by: {evt.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LINKED PERSONS TAB */}
        {activeTab === 'persons' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-graphite-800">
              <h3 className="text-xs font-bold text-slate-200 font-mono">
                PARTIES ASSOCIATED WITH CASE (LEGAL ROLES)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {c.linkedPersons?.map((pa: any) => (
                <div
                  key={pa.id}
                  onClick={() => pa.person && navigate(`/persons/${pa.person.id}`)}
                  className="rounded-lg border border-graphite-800 bg-graphite-950/60 p-4 hover:border-cyan-500/40 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-100 text-sm">
                      {pa.person?.fullName || 'Recorded Party'}
                    </span>
                    <span className="rounded bg-amber-950 text-amber-300 border border-amber-800/40 px-2 py-0.5 text-[10px] font-bold font-mono">
                      {pa.legalRole}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400">{pa.person?.recordNumber}</p>
                  {pa.chargesOrAllegations && (
                    <div className="mt-2 text-xs text-slate-300 bg-graphite-900/80 p-2 rounded border border-graphite-800">
                      <span className="text-slate-500 font-medium">Allegation / Context:</span> {pa.chargesOrAllegations}
                    </div>
                  )}
                  {pa.person?.aliases?.length > 0 && (
                    <p className="text-[10px] text-slate-500 mt-2">Aliases: {pa.person.aliases.join(', ')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EVIDENCE TAB */}
        {activeTab === 'evidence' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-graphite-800">
              <h3 className="text-xs font-bold text-slate-200 font-mono">
                EVIDENTIARY EXHIBITS & SEIZED PROPERTY
              </h3>
              <button
                onClick={() => navigate('/evidence')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
              >
                Open Full Evidence Registry →
              </button>
            </div>

            <div className="space-y-2">
              {c.linkedEvidence?.map((e: any) => (
                <div
                  key={e.id}
                  onClick={() => navigate(`/evidence/${e.id}`)}
                  className="flex items-center justify-between p-3 rounded-lg border border-graphite-800 bg-graphite-950/50 hover:bg-graphite-800/60 cursor-pointer transition-all"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-cyan-400">{e.evidenceNumber}</span>
                      <span className="rounded bg-graphite-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-400">
                        {e.barcode}
                      </span>
                      <span className="text-[10px] text-slate-400">Category: {e.category}</span>
                    </div>
                    <p className="text-xs text-slate-200 mt-1">{e.description}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Storage: {e.storageLocation} • Custodian: {e.currentCustodianName}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-cyan-400">View Custody →</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-graphite-800">
              <h3 className="text-xs font-bold text-slate-200 font-mono">
                INDEXED CASE DOCUMENTS & FILINGS
              </h3>
            </div>

            <div className="space-y-2">
              {c.linkedDocuments?.map((doc: any) => (
                <div
                  key={doc.id}
                  onClick={() => navigate(`/documents/${doc.id}`)}
                  className="flex items-center justify-between p-3 rounded-lg border border-graphite-800 bg-graphite-950/50 hover:bg-graphite-800/60 cursor-pointer transition-all"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-blue-400">{doc.documentNumber}</span>
                      <span className="text-[10px] rounded bg-graphite-800 px-1.5 py-0.2 text-slate-400">
                        {doc.documentType}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">SHA-256 Verified</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 mt-1">{doc.title}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-xl mt-0.5">
                      {doc.extractedText?.slice(0, 160)}...
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-blue-400">Inspect OCR →</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INCIDENTS TAB */}
        {activeTab === 'incidents' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-200 font-mono pb-2 border-b border-graphite-800">
              DOCUMENTED CRIME OCCURRENCES & LOCATIONS
            </h3>
            <div className="space-y-2">
              {c.linkedIncidents?.map((inc: any) => (
                <div key={inc.id} className="p-3 rounded-lg border border-graphite-800 bg-graphite-950/50">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-red-400">{inc.incidentNumber}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(inc.occurredAt).toLocaleString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 mt-0.5">{inc.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{inc.description}</p>
                  {inc.location && (
                    <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-cyan-400 font-mono">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{inc.location.locationName} — {inc.location.formattedAddress}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RELATIONSHIPS TAB */}
        {activeTab === 'relationships' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-graphite-800">
              <h3 className="text-xs font-bold text-slate-200 font-mono">
                DOCUMENTED & AI-SUGGESTED CASE CONNECTIONS
              </h3>
              <button
                onClick={() => navigate('/graph')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
              >
                Open Full Interactive Relationship Graph →
              </button>
            </div>

            <div className="space-y-2">
              {c.relationships?.map((rel: any) => (
                <div key={rel.id} className="p-3 rounded-lg border border-graphite-800 bg-graphite-950/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        {rel.relatedCase?.caseNumber || 'Related Docket'}
                      </span>
                      <span className="text-[10px] rounded bg-graphite-800 px-1.5 py-0.2 text-slate-300 font-mono">
                        {rel.relationshipType.replace(/_/g, ' ')}
                      </span>
                      {rel.isVerified ? (
                        <span className="text-[10px] text-emerald-400 font-bold">Verified Link</span>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-bold">AI Suggestion (Unverified)</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Confidence: {Math.round(rel.confidenceScore * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 mt-1">{rel.description}</p>
                  {rel.supportingEvidence && (
                    <p className="text-[11px] text-slate-400 mt-1 italic">
                      Supporting Evidence: {rel.supportingEvidence}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COURT PROCEEDINGS TAB */}
        {activeTab === 'court' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-200 font-mono pb-2 border-b border-graphite-800">
              JUDICIAL HEARINGS & COURT DOCKETS
            </h3>
            <div className="space-y-2">
              {c.courtProceedings?.map((cp: any) => (
                <div key={cp.id} className="p-3 rounded-lg border border-graphite-800 bg-graphite-950/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-purple-400">{cp.proceedingNumber}</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Hearing: {new Date(cp.hearingDate).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100">{cp.courtName}</h4>
                  <p className="text-xs text-slate-400"><span className="text-slate-500">Judge:</span> {cp.presidingJudge}</p>
                  <p className="text-xs text-slate-300 mt-1">{cp.matterDescription}</p>
                  {cp.legalOutcome && (
                    <div className="mt-2 p-2 rounded bg-graphite-900 text-xs text-cyan-300 font-mono">
                      Outcome: {cp.legalOutcome}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Timeline Event Modal */}
      {addTimelineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-graphite-700 bg-graphite-900 shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-graphite-800">
              <h3 className="text-xs font-bold text-slate-100 font-mono">LOG TIMELINE EVENT</h3>
              <button onClick={() => setAddTimelineOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddTimeline} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={timelineTitle}
                  onChange={e => setTimelineTitle(e.target.value)}
                  placeholder="e.g. Seizure memo recorded for mobile device"
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Event Type</label>
                <select
                  value={timelineType}
                  onChange={e => setTimelineType(e.target.value)}
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="INVESTIGATOR_NOTE">Investigator Note</option>
                  <option value="WITNESS_INTERVIEW">Witness Interview</option>
                  <option value="EVIDENCE_COLLECTED">Evidence Collected</option>
                  <option value="FORENSIC_RESULT">Forensic Result</option>
                  <option value="STATUS_CHANGE">Status Change</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Detailed Description *</label>
                <textarea
                  rows={3}
                  required
                  value={timelineDesc}
                  onChange={e => setTimelineDesc(e.target.value)}
                  placeholder="Official record details of event."
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-graphite-800">
                <button
                  type="button"
                  onClick={() => setAddTimelineOpen(false)}
                  className="rounded-lg border border-graphite-700 bg-graphite-800 px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-graphite-950"
                >
                  Save Timeline Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
