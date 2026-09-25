// ============================================================================
// IMPORT DATA MODAL — Drag & Drop Excel/CSV & Live Google Sheet Sync
// ============================================================================

'use client';

import React, { useState, useRef } from 'react';
import {
  X, FileSpreadsheet, Globe, UploadCloud, CheckCircle2,
  AlertCircle, Download, ArrowRight, Loader2, Sparkles
} from 'lucide-react';
import {
  parseExcelOrCsv, parseGoogleSheetUrl, applyImportedData, ImportResult
} from '@/lib/sheetImporter';
import * as XLSX from 'xlsx';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportDataModal({ isOpen, onClose }: ImportDataModalProps) {
  const [activeTab, setActiveTab] = useState<'excel' | 'google-sheet'>('excel');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // --- Handle Local File ---
  const handleFile = async (file: File) => {
    setLoading(true);
    setImportResult(null);
    setSuccessMessage(null);

    try {
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const res = parseExcelOrCsv(text, file.name);
        setImportResult(res);
      } else {
        const buffer = await file.arrayBuffer();
        const res = parseExcelOrCsv(buffer, file.name);
        setImportResult(res);
      }
    } catch (err: any) {
      setImportResult({
        robots: [],
        tasks: [],
        summary: { robotsCount: 0, tasksCount: 0, detectedSheets: [] },
        errors: [err.message || 'Failed to read file'],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // --- Handle Google Sheet Sync ---
  const handleGoogleSheetSync = async () => {
    if (!googleSheetUrl.trim()) return;
    setLoading(true);
    setImportResult(null);
    setSuccessMessage(null);

    const res = await parseGoogleSheetUrl(googleSheetUrl.trim());
    setImportResult(res);
    setLoading(false);
  };

  // --- Apply Data into Fleet Store ---
  const handleApply = () => {
    if (!importResult) return;
    applyImportedData(importResult);
    setSuccessMessage(`Successfully loaded ${importResult.summary.robotsCount} robots and ${importResult.summary.tasksCount} tasks into Mission Control!`);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  // --- Download Starter Sample Template ---
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Sample Robots Sheet
    const robotsData = [
      { robot_id: 'R-0001', capability: 'transport', x: 250, y: 180, battery: 95, speed: 3.0, status: 'idle' },
      { robot_id: 'R-0002', capability: 'assembly', x: 400, y: 320, battery: 88, speed: 2.2, status: 'idle' },
      { robot_id: 'R-0003', capability: 'inspection', x: 750, y: 220, battery: 100, speed: 3.5, status: 'idle' },
      { robot_id: 'R-0004', capability: 'welding', x: 600, y: 500, battery: 72, speed: 2.0, status: 'idle' },
      { robot_id: 'R-0005', capability: 'heavy-lift', x: 850, y: 450, battery: 80, speed: 1.8, status: 'idle' },
    ];
    const wsRobots = XLSX.utils.json_to_sheet(robotsData);
    XLSX.utils.book_append_sheet(wb, wsRobots, 'Robots');

    // Sample Tasks Sheet
    const tasksData = [
      { task_id: 'T-0001', name: 'Deliver crate to Bay 4', priority: 'high', required_capability: 'transport', x: 500, y: 350 },
      { task_id: 'T-0002', name: 'Weld structural truss', priority: 'critical', required_capability: 'welding', x: 620, y: 520 },
      { task_id: 'T-0003', name: 'Inspect optical seam', priority: 'medium', required_capability: 'inspection', x: 780, y: 240 },
    ];
    const wsTasks = XLSX.utils.json_to_sheet(tasksData);
    XLSX.utils.book_append_sheet(wb, wsTasks, 'Tasks');

    XLSX.writeFile(wb, 'FleetOps_Data_Template.xlsx');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                Import Fleet & Task Data
              </h2>
              <p className="text-[11px] text-slate-400">
                Load custom robots, tasks, and coordinates from Excel, CSV, or Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1">
          <button
            onClick={() => setActiveTab('excel')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'excel'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel / CSV File Upload
          </button>
          <button
            onClick={() => setActiveTab('google-sheet')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'google-sheet'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            Google Sheets Live Sync
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {activeTab === 'excel' ? (
            <div className="space-y-3">
              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-950/30'
                    : 'border-slate-700 hover:border-slate-500 bg-slate-800/30 hover:bg-slate-800/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                <UploadCloud className="w-10 h-10 text-cyan-400 mb-2 opacity-80" />
                <p className="text-xs font-semibold text-slate-200">
                  Click to browse or drag and drop your file here
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports Microsoft Excel (<code className="text-cyan-400">.xlsx</code>, <code className="text-cyan-400">.xls</code>) or <code className="text-cyan-400">.csv</code>
                </p>
              </div>

              {/* Sample Template Download */}
              <div className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                <div>
                  <p className="text-xs font-medium text-slate-300">Need a sample format for your team?</p>
                  <p className="text-[10px] text-slate-500">Pre-formatted Excel workbook with Robots and Tasks sheets</p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Sample Excel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Google Sheet Shareable URL
                </label>
                <p className="text-[11px] text-slate-400">
                  Paste the Google Sheets link below. Ensure the sheet permission is set to <strong>"Anyone with the link can view"</strong>.
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit..."
                    value={googleSheetUrl}
                    onChange={(e) => setGoogleSheetUrl(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    onClick={handleGoogleSheetSync}
                    disabled={loading || !googleSheetUrl.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    Fetch & Sync
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center justify-center p-6 text-slate-400 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Analyzing spreadsheet columns and rows...</span>
            </div>
          )}

          {/* Success Message Banner */}
          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-700/50 text-emerald-300 rounded-xl text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Parsed Result Preview */}
          {importResult && !loading && (
            <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Parsed Data Preview
                </span>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-cyan-400 font-bold">{importResult.summary.robotsCount} Robots</span>
                  <span className="text-emerald-400 font-bold">{importResult.summary.tasksCount} Tasks</span>
                </div>
              </div>

              {importResult.errors.length > 0 ? (
                <div className="p-2.5 bg-rose-950/30 border border-rose-800/40 text-rose-300 rounded-lg text-xs space-y-1">
                  {importResult.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-400">
                    Detected sheets: <span className="font-mono text-slate-200">{importResult.summary.detectedSheets.join(', ')}</span>
                  </p>

                  {/* Sample Robot Rows */}
                  {importResult.robots.length > 0 && (
                    <div className="text-[11px] space-y-1">
                      <span className="text-slate-500 font-semibold uppercase text-[10px]">Robot Samples:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {importResult.robots.slice(0, 5).map(r => (
                          <span key={r.id} className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px] border border-slate-700">
                            {r.id} ({r.capability} @ {Math.round(r.position.x)},{Math.round(r.position.y)})
                          </span>
                        ))}
                        {importResult.robots.length > 5 && (
                          <span className="text-slate-500 text-[10px] self-center">
                            +{importResult.robots.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sample Task Rows */}
                  {importResult.tasks.length > 0 && (
                    <div className="text-[11px] space-y-1">
                      <span className="text-slate-500 font-semibold uppercase text-[10px]">Task Samples:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {importResult.tasks.slice(0, 4).map(t => (
                          <span key={t.id} className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono text-[10px] border border-slate-700">
                            {t.id}: {t.name} [{t.priority}]
                          </span>
                        ))}
                        {importResult.tasks.length > 4 && (
                          <span className="text-slate-500 text-[10px] self-center">
                            +{importResult.tasks.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/70">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!importResult || (importResult.robots.length === 0 && importResult.tasks.length === 0)}
            className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-emerald-900/30"
          >
            <span>Load into Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
