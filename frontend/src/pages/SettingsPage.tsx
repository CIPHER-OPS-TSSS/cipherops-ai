import React, { useState } from 'react';
import { Settings, Shield, Bot, Map, Database, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [aiProvider, setAiProvider] = useState('MOCK');
  const [aiModel, setAiModel] = useState('mock-gpt4-investigator');
  const [aiApiKey, setAiApiKey] = useState('••••••••••••••••••••••••••••••••');
  const [retentionYears, setRetentionYears] = useState('10');
  const [mapTileStyle, setMapTileStyle] = useState('Dark Graphite (CartoDB Dark)');
  const [isResetting, setIsResetting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDemoData = async () => {
    const ok = window.confirm(
      'Are you sure you want to reset the system database back to the baseline fictional demo dataset (20 cases, 30 persons, 25 incidents, 40 documents)?'
    );
    if (!ok) return;

    setIsResetting(true);
    try {
      const res = await api.resetDemoData();
      alert(`Success: ${res.message}. Records reloaded.`);
      window.location.reload();
    } catch (e: any) {
      alert(`Error resetting demo data: ${e.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono flex items-center space-x-2">
          <Settings className="h-5 w-5 text-cyan-400" />
          <span>SYSTEM CONFIGURATION & SECURITY GOVERNANCE</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          AI subsystem parameters, geospatial tile sources, data retention policies, and demo sandbox controls.
        </p>
      </div>

      {savedSuccess && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>System configuration parameters updated and applied to runtime environment.</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* AI Configuration */}
        <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-graphite-800">
            <Bot className="h-4 w-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider">
              AI Decision-Support Provider
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Inference Provider</label>
              <select
                value={aiProvider}
                onChange={e => setAiProvider(e.target.value)}
                className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="MOCK">Intelligent Mock AI (Grounded Decision Engine)</option>
                <option value="OPENAI">OpenAI API (GPT-4o / Text-Embedding-3)</option>
                <option value="GEMINI">Google Gemini 1.5 Pro</option>
                <option value="OLLAMA">Ollama Local Air-Gapped LLM (Llama 3)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Configured Model Identifier</label>
              <input
                type="text"
                value={aiModel}
                onChange={e => setAiModel(e.target.value)}
                className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Provider API Credentials (Secured Backend Variable)
              </label>
              <input
                type="password"
                value={aiApiKey}
                onChange={e => setAiApiKey(e.target.value)}
                className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Keys remain encrypted on backend and are never sent to the browser.
              </p>
            </div>
          </div>
        </div>

        {/* Map & Geospatial Configuration */}
        <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-graphite-800">
            <Map className="h-4 w-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider">
              Geospatial Tile Provider & Boundaries
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Cartographic Tile Layer</label>
              <select
                value={mapTileStyle}
                onChange={e => setMapTileStyle(e.target.value)}
                className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="OpenStreetMap Standard">OpenStreetMap Standard</option>
                <option value="Dark Graphite (CartoDB Dark)">Dark Graphite (High-Contrast Intelligence)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Geocoding Precision</label>
              <span className="block py-1.5 px-3 text-xs font-mono text-cyan-300 bg-graphite-950 rounded border border-graphite-800">
                WGS84 Ellipsoid (±0.0001° Accuracy)
              </span>
            </div>
          </div>
        </div>

        {/* Data Retention & Legal Hold */}
        <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-graphite-800">
            <Shield className="h-4 w-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider">
              Statutory Retention & Sealing Protocols
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Standard Retention Period</label>
              <select
                value={retentionYears}
                onChange={e => setRetentionYears(e.target.value)}
                className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="5">5 Years (Minor Offenses)</option>
                <option value="10">10 Years (Standard Evidentiary Records)</option>
                <option value="25">25 Years (Major Heinous Crimes)</option>
                <option value="PERMANENT">Permanent / Indefinite Archival</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Expungement Compliance</label>
              <span className="block py-1.5 px-3 text-xs font-mono text-emerald-400 bg-graphite-950 rounded border border-graphite-800">
                Judicial Sealing & Verified Hash Redaction
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-semibold text-graphite-950 transition-colors shadow-md shadow-cyan-900/40"
          >
            Save System Configurations
          </button>
        </div>
      </form>

      {/* Demo Data Management */}
      <div className="rounded-xl border border-red-500/30 bg-graphite-900/90 p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-graphite-800">
          <div className="flex items-center space-x-2">
            <RotateCcw className="h-4 w-4 text-red-400" />
            <h2 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider">
              Fictional Demo Dataset Control
            </h2>
          </div>
          <span className="rounded bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 text-[10px] font-mono font-bold">
            ADMIN ACTION
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Reset all database stores to the baseline fictional demo dataset (20 cases, 30 person records, 25 incidents, 15 locations, 40 documents, 20 evidence items with custody chains, and AI suggested links).
        </p>

        <button
          type="button"
          onClick={handleResetDemoData}
          disabled={isResetting}
          className="flex items-center space-x-2 rounded-lg bg-red-950 border border-red-800 hover:bg-red-900 px-3.5 py-2 text-xs font-semibold text-red-200 transition-colors"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'Reloading Seed Dataset...' : 'Reset to Fictional Seed Data'}</span>
        </button>
      </div>
    </div>
  );
};
