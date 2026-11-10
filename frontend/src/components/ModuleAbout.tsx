import React, { useState, useEffect } from 'react';
import {
  Info,
  Layers,
  Cpu,
  Target,
  Database,
  Binary,
  Code2,
  Workflow,
  Sparkles,
  CheckCircle2,
  Rocket,
  ShieldCheck,
  Server,
  MonitorSmartphone,
  ExternalLink
} from 'lucide-react';
import { fetchAboutProject } from '../services/api';

export const ModuleAbout: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadInfo = async () => {
      try {
        setLoading(true);
        const res = await fetchAboutProject();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadInfo();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm font-medium">Loading project architecture & academic documentation...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Title Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Info className="w-3.5 h-3.5" />
          Module 8: System Architecture & Academic Specification
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          SmartPark AI Project Specification
        </h1>
        <p className="mt-2 text-slate-300 text-sm max-w-3xl leading-relaxed">
          {data.subtitle}
        </p>
      </div>

      {/* Problem Statement & Objectives Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Problem Statement */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border-l-4 border-l-blue-500">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-blue-400" />
            Problem Statement
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            {data.problem_statement}
          </p>
          <div className="mt-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <p className="text-slate-200 font-semibold">Key Real-World Inefficiencies Addressed:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Drivers spend an average of 14-20 minutes searching for parking in urban cores.</li>
              <li>Cruising accounts for up to 30% of downtown traffic congestion during peak hours.</li>
              <li>Static parking structures lack predictive capacity forecasting for transit authorities.</li>
            </ul>
          </div>
        </div>

        {/* Project Objectives */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border-l-4 border-l-emerald-500">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Project Objectives
          </h2>
          <ul className="space-y-3">
            {data.project_objectives.map((obj: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Dataset Description & Preprocessing */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
          <Database className="w-5 h-5 text-blue-400" />
          Dataset Architecture & Feature Engineering
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          {data.dataset_description.source} — {data.dataset_description.total_records.toLocaleString()} rows at {data.dataset_description.granularity}.
        </p>

        {/* Feature dictionary table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Feature Column</th>
                <th className="py-2.5 px-3">Data Type</th>
                <th className="py-2.5 px-3">Role & Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data.dataset_description.features.map((feat: any) => (
                <tr key={feat.name} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                    {feat.name}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">
                    {feat.type}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {feat.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Preprocessing Pipeline box */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
          <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Workflow className="w-4 h-4 text-blue-400" />
            Preprocessing Pipeline (Scikit-learn ColumnTransformer)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Categorical Encoding</span>
              <p className="font-mono text-blue-400 mt-1">{data.data_preprocessing.categorical_encoding}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Continuous Normalization</span>
              <p className="font-mono text-emerald-400 mt-1">{data.data_preprocessing.continuous_scaling}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Split Validation</span>
              <p className="text-slate-300 mt-1">{data.data_preprocessing.train_test_split}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Algorithms Used */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
          <Binary className="w-5 h-5 text-emerald-400" />
          Machine Learning Algorithms & Mathematical Foundations
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Three supervised regression architectures evaluated under identical holdout test parameters.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.algorithms_used.map((alg: any) => (
            <div key={alg.name} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                    {alg.type}
                  </span>
                  {alg.status && (
                    <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      SELECTED
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white mt-2.5">{alg.name}</h3>
                
                <div className="mt-4 space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Algorithmic Strengths:</span>
                    <p className="text-slate-200 mt-0.5 leading-relaxed">{alg.strengths}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Limitations / Behavior:</span>
                    <p className="text-slate-300 mt-0.5 leading-relaxed">{alg.limitations || 'None in practical bounds'}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Architecture */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
          <Server className="w-5 h-5 text-blue-400" />
          End-to-End System Architecture
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3">
              <MonitorSmartphone className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Client Frontend</h4>
            <p className="text-xs font-mono text-blue-400 mt-1">React 19 + TypeScript</p>
            <p className="text-xs text-slate-400 mt-2">
              Vite build, Tailwind CSS dark navy UI, Recharts interactive data visualization.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <Server className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Application API</h4>
            <p className="text-xs font-mono text-emerald-400 mt-1">FastAPI + Uvicorn</p>
            <p className="text-xs text-slate-400 mt-2">
              Asynchronous REST routing, Pydantic v2 validation, CORS middleware, lifespan manager.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-3">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Machine Learning</h4>
            <p className="text-xs font-mono text-purple-400 mt-1">Scikit-learn + Joblib</p>
            <p className="text-xs text-slate-400 mt-2">
              Persisted models, preprocessing pipeline, multi-model evaluation, JSON metrics metadata.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Relational Store</h4>
            <p className="text-xs font-mono text-amber-400 mt-1">SQLite + SQLAlchemy</p>
            <p className="text-xs text-slate-400 mt-2">
              Persistent facilities, bay matrices, reservation history, and historical telemetry logs.
            </p>
          </div>
        </div>
      </div>

      {/* Future Enhancements */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Rocket className="w-5 h-5 text-emerald-400" />
          Future Enhancements & Research Roadmap
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.future_enhancements.map((enh: string, idx: number) => (
            <div key={idx} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{enh}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
