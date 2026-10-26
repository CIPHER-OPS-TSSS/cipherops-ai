import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Shield, ArrowLeft, Plus, FolderOpen, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { api } from '../services/api';

export const PersonDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [linkCaseModalOpen, setLinkCaseModalOpen] = useState(false);
  const [availableCases, setAvailableCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedLegalRole, setSelectedLegalRole] = useState('WITNESS');
  const [allegationsNote, setAllegationsNote] = useState('');
  const navigate = useNavigate();

  const fetchPerson = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await api.getPersonById(id);
      setPerson(res.person);
    } catch (err) {
      console.error('Failed to load person:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerson();
    api.getCases().then(res => {
      setAvailableCases(res.cases);
      if (res.cases.length > 0) setSelectedCaseId(res.cases[0].id);
    });
  }, [id]);

  const handleLinkCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedCaseId) return;
    try {
      await api.linkPersonToCase(id, {
        caseId: selectedCaseId,
        legalRole: selectedLegalRole,
        chargesOrAllegations: allegationsNote,
      });
      setLinkCaseModalOpen(false);
      fetchPerson();
    } catch (err: any) {
      alert(`Error linking case: ${err.message}`);
    }
  };

  if (isLoading || !person) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mb-3" />
          <p className="text-xs font-mono text-cyan-400">Retrieving Person Official Record & Classified Ties...</p>
        </div>
      </div>
    );
  }

  const p = person;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/persons')}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Person Records</span>
        </button>
        <button
          onClick={() => setLinkCaseModalOpen(true)}
          className="flex items-center space-x-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-graphite-950 transition-colors shadow-md shadow-cyan-900/40"
        >
          <Plus className="h-4 w-4" />
          <span>Associate with Case Dossier</span>
        </button>
      </div>

      {/* Main Profile Card */}
      <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="font-mono text-xl font-bold text-cyan-300">{p.recordNumber}</span>
              <span className="rounded bg-amber-950 text-amber-300 border border-amber-800/40 px-2.5 py-0.5 text-xs font-bold font-mono">
                {p.primaryLegalRole}
              </span>
              <span className="rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40 px-2 py-0.5 text-xs font-mono">
                {p.verificationStatus}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">{p.fullName}</h1>
            {p.aliases?.length > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                Known Aliases: <span className="text-slate-200">{p.aliases.join(', ')}</span>
              </p>
            )}
          </div>

          <div className="rounded-lg border border-graphite-800 bg-graphite-950/70 p-3.5 text-xs space-y-1.5 min-w-[240px]">
            <p className="text-slate-400">
              <span className="text-slate-500">Gender:</span> {p.gender || 'Not Disclosed'}
            </p>
            <p className="text-slate-400">
              <span className="text-slate-500">National ID (Masked):</span>{' '}
              <span className="font-mono text-cyan-300">{p.nationalIdMasked || 'XXXX-XXXX-4819'}</span>
            </p>
            <p className="text-slate-400">
              <span className="text-slate-500">Contact:</span>{' '}
              <span className="font-mono">{p.contactNumber || 'Authorized Line Only'}</span>
            </p>
            <p className="text-slate-400">
              <span className="text-slate-500">Source:</span> {p.sourceOfInfo}
            </p>
          </div>
        </div>

        {/* Address and Identifying Marks */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-graphite-800">
          <div className="rounded-lg bg-graphite-950/60 p-3 border border-graphite-800 text-xs">
            <p className="font-mono text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Documented Address History & Location
            </p>
            <p className="text-slate-200 font-medium">{p.currentAddress || 'No verified address recorded'}</p>
          </div>

          <div className="rounded-lg bg-graphite-950/60 p-3 border border-graphite-800 text-xs">
            <p className="font-mono text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Recorded Identifying Physical Marks
            </p>
            {p.identifyingMarks?.length > 0 ? (
              <ul className="list-disc pl-4 text-slate-300 space-y-0.5">
                {p.identifyingMarks.map((mark: string, idx: number) => (
                  <li key={idx}>{mark}</li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500">None officially logged.</p>
            )}
          </div>
        </div>
      </div>

      {/* Linked Cases Docket */}
      <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-5 shadow-xl">
        <h2 className="text-sm font-bold text-slate-100 font-mono mb-4 flex items-center space-x-2">
          <FolderOpen className="h-4 w-4 text-cyan-400" />
          <span>ASSOCIATED OFFICIAL CASE PROCEEDINGS ({p.linkedCases?.length || 0})</span>
        </h2>

        {p.linkedCases?.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No active case associations formally attached to this record.
          </p>
        ) : (
          <div className="space-y-3">
            {p.linkedCases?.map((assoc: any) => (
              <div
                key={assoc.id}
                onClick={() => assoc.case && navigate(`/cases/${assoc.case.id}`)}
                className="rounded-lg border border-graphite-800 bg-graphite-950/50 p-4 hover:border-cyan-500/40 cursor-pointer transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm font-bold text-cyan-400">
                      {assoc.case?.caseNumber || 'Case Record'}
                    </span>
                    {assoc.case?.firNumber && (
                      <span className="rounded bg-graphite-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                        FIR: {assoc.case.firNumber}
                      </span>
                    )}
                    <span className="rounded bg-amber-950 text-amber-300 border border-amber-800/40 px-2 py-0.5 text-[10px] font-bold font-mono">
                      Role: {assoc.legalRole}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    Station: {assoc.case?.policeStation}
                  </span>
                </div>

                <h3 className="text-xs font-semibold text-slate-200 mt-2">{assoc.case?.title}</h3>
                {assoc.chargesOrAllegations && (
                  <div className="mt-2 text-xs text-slate-300 bg-graphite-900/80 p-2.5 rounded border border-graphite-800/80">
                    <span className="text-slate-400 font-medium">Allegation Context:</span> {assoc.chargesOrAllegations}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Associate with Case Modal */}
      {linkCaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-graphite-700 bg-graphite-900 shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-graphite-800">
              <h3 className="text-xs font-bold text-slate-100 font-mono">LINK PERSON TO CASE DOSSIER</h3>
              <button onClick={() => setLinkCaseModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleLinkCase} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Case *</label>
                <select
                  value={selectedCaseId}
                  onChange={e => setSelectedCaseId(e.target.value)}
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  {availableCases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.caseNumber} — {c.title.slice(0, 36)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Designated Legal Role *</label>
                <select
                  value={selectedLegalRole}
                  onChange={e => setSelectedLegalRole(e.target.value)}
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="ACCUSED">Accused</option>
                  <option value="SUSPECT">Suspect</option>
                  <option value="WITNESS">Witness</option>
                  <option value="COMPLAINANT">Complainant</option>
                  <option value="VICTIM">Victim</option>
                  <option value="PERSON_OF_INTEREST">Person of Interest</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Charges or Official Allegation Context
                </label>
                <textarea
                  rows={3}
                  value={allegationsNote}
                  onChange={e => setAllegationsNote(e.target.value)}
                  placeholder="Official charges, statement summary, or grounds for investigative relevance."
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-graphite-800">
                <button
                  type="button"
                  onClick={() => setLinkCaseModalOpen(false)}
                  className="rounded-lg border border-graphite-700 bg-graphite-800 px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-graphite-950"
                >
                  Save Association
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
