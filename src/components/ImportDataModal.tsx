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
  parseExcelOrCsv, parseGoogleSheetUrl, applyImportedData, ImportResult,
  DEFAULT_IOT_TELEMETRY, parseIoTTelemetryFromRows
} from '@/lib/sheetImporter';
import { useFleetStore } from '@/store/useFleetStore';
import * as XLSX from 'xlsx';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportDataModal({ isOpen, onClose }: ImportDataModalProps) {
  const [activeTab, setActiveTab] = useState<'excel' | 'google-sheet' | 'iot-telemetry'>('excel');
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

  // --- Load IoT Telemetry Preset Dataset ---
  const handleLoadIoTDataset = () => {
    setLoading(true);
    setSuccessMessage(null);
    setTimeout(() => {
      const parsed = parseIoTTelemetryFromRows(DEFAULT_IOT_TELEMETRY as any);
      setImportResult({
        robots: [],
        tasks: parsed.generatedTasks,
        telemetry: parsed.telemetry,
        summary: {
          robotsCount: 0,
          tasksCount: parsed.generatedTasks.length,
          telemetryCount: parsed.telemetry.length,
          detectedSheets: ['Poultry_IoT_Telemetry_Live.csv'],
          detectedFaults: ['WAIT_DRY_RUN', 'TANK_EMPTY', 'PIPE_DAMAGE', 'PIPE2_ERROR', 'TANK_FULL'],
        },
        errors: [],
      });
      setLoading(false);
    }, 200);
  };

  // --- Apply Data into Fleet Store ---
  const handleApply = () => {
    if (!importResult) return;
    applyImportedData(importResult);
    if (importResult.summary.telemetryCount && importResult.summary.telemetryCount > 0) {
      setSuccessMessage(`Loaded ${importResult.summary.telemetryCount} IoT telemetry readings & ${importResult.summary.tasksCount} emergency tasks! Opening Telemetry Hub...`);
      useFleetStore.getState().setActiveTab('iot-hub');
    } else {
      setSuccessMessage(`Successfully loaded ${importResult.summary.robotsCount} robots and ${importResult.summary.tasksCount} tasks into Mission Control!`);
    }
    setTimeout(() => {
      onClose();
    }, 1000);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-white border border-slate-300 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-200 text-black border border-slate-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-black uppercase tracking-wider font-mono">
                Import Fleet & Task Data
              </h2>
              <p className="text-[11px] text-slate-500">
                Load custom robots, tasks, and coordinates from Excel, CSV, or Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-black hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1 gap-1">
          <button
            onClick={() => setActiveTab('excel')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'excel'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-600 hover:text-black hover:bg-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel / CSV Upload
          </button>
          <button
            onClick={() => setActiveTab('google-sheet')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'google-sheet'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-600 hover:text-black hover:bg-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            Google Sheets Sync
          </button>
          <button
            onClick={() => {
              setActiveTab('iot-telemetry');
              handleLoadIoTDataset();
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'iot-telemetry'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-600 hover:text-black hover:bg-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Poultry IoT Telemetry
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
                    ? 'border-black bg-slate-100'
                    : 'border-slate-300 hover:border-black bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                <UploadCloud className="w-10 h-10 text-black mb-2 opacity-80" />
                <p className="text-xs font-bold text-slate-900">
                  Click to browse or drag and drop your file here
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports Microsoft Excel (<code className="text-black font-semibold">.xlsx</code>, <code className="text-black font-semibold">.xls</code>) or <code className="text-black font-semibold">.csv</code>
                </p>
              </div>

              {/* Sample Template Download */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-slate-800">Need a sample format for your team?</p>
                  <p className="text-[10px] text-slate-500">Pre-formatted Excel workbook with Robots and Tasks sheets</p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300 rounded-lg shadow-2xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-black" />
                  Sample Excel
                </button>
              </div>
            </div>
          ) : activeTab === 'google-sheet' ? (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  Google Sheet Shareable URL
                </label>
                <p className="text-[11px] text-slate-500">
                  Paste the Google Sheets link below. Ensure the sheet permission is set to <strong>"Anyone with the link can view"</strong>.
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit..."
                    value={googleSheetUrl}
                    onChange={(e) => setGoogleSheetUrl(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black font-mono"
                  />
                  <button
                    onClick={handleGoogleSheetSync}
                    disabled={loading || !googleSheetUrl.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    Fetch & Sync
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* IoT Telemetry Tab */
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Poultry Farm Controller IoT Telemetry (20 Log Entries)
                    </h3>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Logged from automated farm controller: Dual Temp probes (<code className="font-bold text-black">TEM1/TEM2</code>), Flow switches (<code className="font-bold text-black">S1/S2</code>), Pump Motor relay, and Fault alarms.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-white border border-slate-200 rounded-lg">
                    <p className="text-[10px] text-slate-500 font-mono">Total Readings</p>
                    <p className="text-sm font-bold font-mono text-black">19 Rows</p>
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-lg">
                    <p className="text-[10px] text-slate-500 font-mono">Avg Temp</p>
                    <p className="text-sm font-bold font-mono text-rose-600">31.95 °C</p>
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-lg">
                    <p className="text-[10px] text-slate-500 font-mono">Avg Humidity</p>
                    <p className="text-sm font-bold font-mono text-cyan-600">58% RH</p>
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-lg">
                    <p className="text-[10px] text-slate-500 font-mono">Detected Faults</p>
                    <p className="text-sm font-bold font-mono text-rose-600">4 Incidents</p>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleLoadIoTDataset}
                    className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Load & Stage 20 IoT Entries
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center justify-center p-6 text-slate-600 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-black" />
              <span className="font-medium">Analyzing spreadsheet columns and rows...</span>
            </div>
          )}

          {/* Success Message Banner */}
          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Parsed Result Preview */}
          {importResult && !loading && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Parsed Data Preview
                </span>
                <div className="flex items-center gap-3 text-xs font-mono font-bold">
                  {importResult.summary.telemetryCount ? (
                    <>
                      <span className="text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                        {importResult.summary.telemetryCount} IoT Readings
                      </span>
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {importResult.summary.tasksCount} Emergency Tasks
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-black">{importResult.summary.robotsCount} Robots</span>
                      <span className="text-slate-600">{importResult.summary.tasksCount} Tasks</span>
                    </>
                  )}
                </div>
              </div>

              {importResult.errors.length > 0 ? (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-lg text-xs space-y-1">
                  {importResult.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-600">
                    Detected source: <span className="font-mono font-bold text-black">{importResult.summary.detectedSheets.join(', ')}</span>
                  </p>

                  {/* IoT Telemetry Rows Preview */}
                  {importResult.telemetry && importResult.telemetry.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-semibold uppercase text-[10px]">
                          Synchronized IoT Telemetry Log Samples:
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {importResult.telemetry.length} rows staged
                        </span>
                      </div>
                      <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-white overflow-hidden scrollbar-thin">
                        <table className="w-full text-left text-[10px] font-mono">
                          <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 sticky top-0">
                            <tr>
                              <th className="p-1.5">TIME</th>
                              <th className="p-1.5">TEM1</th>
                              <th className="p-1.5">TEM2</th>
                              <th className="p-1.5">S1</th>
                              <th className="p-1.5">S2</th>
                              <th className="p-1.5">MOTOR</th>
                              <th className="p-1.5">STATUS</th>
                              <th className="p-1.5">MODE</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {importResult.telemetry.slice(0, 10).map((row, idx) => {
                              const isFault = row.status !== 'NORMAL' && row.status !== 'PIPE_NORMAL';
                              return (
                                <tr key={idx} className={isFault ? 'bg-rose-50/50' : ''}>
                                  <td className="p-1.5 whitespace-nowrap text-slate-800">{row.datetime.split(' ')[1] || row.datetime}</td>
                                  <td className="p-1.5 text-slate-900">{row.tem1}°C</td>
                                  <td className="p-1.5 text-slate-900">{row.tem2}°C</td>
                                  <td className="p-1.5">
                                    <span className={`px-1 py-0.2 rounded text-[9px] ${row.s1 === 'WATER' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'}`}>
                                      {row.s1}
                                    </span>
                                  </td>
                                  <td className="p-1.5">
                                    <span className={`px-1 py-0.2 rounded text-[9px] ${row.s2 === 'WATER' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'}`}>
                                      {row.s2}
                                    </span>
                                  </td>
                                  <td className="p-1.5">
                                    <span className={`px-1 py-0.2 rounded font-bold text-[9px] ${row.motor === 'ON' ? 'text-emerald-700 bg-emerald-100' : 'text-slate-600 bg-slate-100'}`}>
                                      {row.motor}
                                    </span>
                                  </td>
                                  <td className="p-1.5 font-bold">
                                    <span className={`px-1 py-0.2 rounded text-[9px] ${isFault ? 'text-rose-700 bg-rose-100 border border-rose-200' : 'text-emerald-700 bg-emerald-50'}`}>
                                      {row.status}
                                    </span>
                                  </td>
                                  <td className="p-1.5 text-slate-500">{row.mode}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {importResult.telemetry.length > 10 && (
                        <p className="text-[10px] text-slate-400 text-center font-mono">
                          +{importResult.telemetry.length - 10} additional readings staged
                        </p>
                      )}
                    </div>
                  )}

                  {/* Sample Robot Rows */}
                  {importResult.robots.length > 0 && (
                    <div className="text-[11px] space-y-1">
                      <span className="text-slate-500 font-semibold uppercase text-[10px]">Robot Samples:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {importResult.robots.slice(0, 5).map(r => (
                          <span key={r.id} className="px-2 py-0.5 rounded bg-white text-slate-900 font-mono text-[10px] border border-slate-300 font-medium">
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
                      <span className="text-slate-500 font-semibold uppercase text-[10px]">
                        Generated Response Tasks:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {importResult.tasks.slice(0, 4).map(t => (
                          <span key={t.id} className="px-2 py-0.5 rounded bg-white text-slate-900 font-mono text-[10px] border border-slate-300 font-medium">
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
        <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors shadow-2xs"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!importResult || (importResult.robots.length === 0 && importResult.tasks.length === 0 && (!importResult.telemetry || importResult.telemetry.length === 0))}
            className="flex items-center gap-1.5 px-5 py-2 bg-black hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all shadow-xs"
          >
            <span>View in Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
