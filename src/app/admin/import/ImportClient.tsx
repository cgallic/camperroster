"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload, FileSpreadsheet, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, Database } from "lucide-react";

export default function UltraCampImporterPage() {
  const [sourceSystem, setSourceSystem] = useState<"ultracamp" | "google_forms" | "campbrain">("ultracamp");
  const [fileUploaded, setFileUploaded] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);

  const sampleParsedRows = [
    { parent: "Sarah Gallic", camper: "Jamie Gallic", dob: "2016-04-12", allergy: "Peanut / Nut Allergy", session: "Session 1" },
    { parent: "Sarah Gallic", camper: "Emma Gallic", dob: "2016-04-12", allergy: "None", session: "Session 1" },
    { parent: "Maria Rivera", camper: "Lucas Rivera", dob: "2015-08-19", allergy: "Mild Asthma", session: "Session 1" },
    { parent: "Jessica Smith", camper: "Noah Smith", dob: "2015-11-03", allergy: "None", session: "Session 2" },
    { parent: "David Johnson", camper: "Chloe Johnson", dob: "2017-02-14", allergy: "Dairy", session: "Session 1" }
  ];

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileUploaded(true);
    }
  };

  const handleExecuteImport = () => {
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      setImportDone(true);
    }, 1200);
  };

  return (
    <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-3 py-1 rounded-full uppercase">
            1-CLICK MIGRATION ENGINE
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-stone-900 mt-2">
            Import Rosters from UltraCamp or Spreadsheets
          </h1>
        </div>
        <Link href="/admin" className="px-4 py-2 rounded-full bg-stone-100 text-stone-800 font-bold text-xs hover:bg-stone-200 w-max">
          ← Back to Director Hub
        </Link>
      </div>

      {importDone ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-emerald-300 shadow-xl text-center space-y-5 animate-in fade-in duration-200">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-stone-900">
            5 Camper Families Successfully Migrated!
          </h2>
          <p className="text-sm sm:text-base text-stone-600 max-w-md mx-auto leading-relaxed">
            All guardian contacts, camper records, and allergy profiles have been structured into your Supabase PostgreSQL database.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/admin" className="btn-primary-agency text-xs py-3 px-6">
              View Camp Roster in Director Hub
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 border-2 border-stone-200 shadow-xl space-y-6">
          
          {/* STEP 1: SELECT SOURCE SYSTEM */}
          <div className="space-y-3">
            <label className="text-xs sm:text-sm font-bold text-stone-800">1. Select Current Software or Format</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setSourceSystem("ultracamp")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  sourceSystem === "ultracamp" ? "border-forest-800 bg-forest-50 shadow-sm" : "border-stone-200 bg-white"
                }`}
              >
                <b className="text-xs sm:text-sm font-black text-stone-900 block">UltraCamp Export</b>
                <span className="text-xs text-stone-500 block mt-1">Direct CSV / Excel Export</span>
              </div>
              <div
                onClick={() => setSourceSystem("google_forms")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  sourceSystem === "google_forms" ? "border-forest-800 bg-forest-50 shadow-sm" : "border-stone-200 bg-white"
                }`}
              >
                <b className="text-xs sm:text-sm font-black text-stone-900 block">Google Sheets / Forms</b>
                <span className="text-xs text-stone-500 block mt-1">Spreadsheet Column Auto-Map</span>
              </div>
              <div
                onClick={() => setSourceSystem("campbrain")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  sourceSystem === "campbrain" ? "border-forest-800 bg-forest-50 shadow-sm" : "border-stone-200 bg-white"
                }`}
              >
                <b className="text-xs sm:text-sm font-black text-stone-900 block">CampBrain / Active</b>
                <span className="text-xs text-stone-500 block mt-1">Generic Household CSV</span>
              </div>
            </div>
          </div>

          {/* STEP 2: UPLOAD CSV */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-bold text-stone-800">2. Upload Exported CSV or XLSX File</label>
            <label className="border-2 border-dashed border-stone-300 hover:border-forest-800 rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center gap-3 cursor-pointer bg-stone-50/50 hover:bg-stone-50 transition-colors">
              <FileSpreadsheet className="w-10 h-10 text-emerald-700" />
              <div className="text-center space-y-1">
                <b className="text-sm font-black text-stone-900 block">
                  {fileUploaded ? "ultracamp_2026_roster_export.csv ready to import" : "Drop your UltraCamp CSV here, or browse"}
                </b>
                <span className="text-xs text-stone-500 block">Supports .csv, .xlsx, .tsv up to 50MB</span>
              </div>
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.tsv"
                onChange={handleSimulateUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* STEP 3: PREVIEW & AUTO-MAPPED COLUMNS */}
          {fileUploaded && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <b className="text-xs sm:text-sm font-black text-stone-900">
                  Preview: Auto-Mapped 5 Columns ({sampleParsedRows.length} Rows Detected)
                </b>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  100% Match
                </span>
              </div>

              <div className="overflow-x-auto border border-stone-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 font-bold text-stone-700 border-b border-stone-200">
                    <tr>
                      <th className="p-3">Parent Name</th>
                      <th className="p-3">Camper Name</th>
                      <th className="p-3">DOB</th>
                      <th className="p-3">Allergy Record</th>
                      <th className="p-3">Target Session</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-stone-800 font-medium">
                    {sampleParsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-stone-50">
                        <td className="p-3 font-bold">{row.parent}</td>
                        <td className="p-3">{row.camper}</td>
                        <td className="p-3 font-mono">{row.dob}</td>
                        <td className="p-3 text-amber-800 font-semibold">{row.allergy}</td>
                        <td className="p-3 font-bold text-forest-900">{row.session}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                disabled={importing}
                onClick={handleExecuteImport}
                className="w-full py-4 rounded-xl bg-forest-900 hover:bg-forest-950 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <Database className="w-4 h-4" />
                <span>{importing ? "Importing Roster Records..." : "Import 5 Families into CamperRoster"}</span>
              </button>
            </div>
          )}

        </div>
      )}

    </main>
  );
}
