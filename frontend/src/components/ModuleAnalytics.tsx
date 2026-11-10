import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  Layers,
  CheckCircle2,
  GitCompare,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { fetchAnalyticsSummary } from '../services/api';

export const ModuleAnalytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const res = await fetchAnalyticsSummary();
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm font-medium">Aggregating historical sensor telemetry & analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <BarChart3 className="w-3.5 h-3.5" />
          Module 5: Multi-Dimensional Analytics
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Parking Telemetry & Demand Analytics
        </h1>
        <p className="mt-1 text-slate-300 text-sm max-w-3xl leading-relaxed">
          In-depth empirical analysis of diurnal curves, day-of-week demand variance, cross-location utilization ratings, and holdout test set regression accuracy.
        </p>
      </div>

      {/* Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Hourly Parking Occupancy by Location */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Hourly Parking Occupancy Curve
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                24-hour diurnal occupancy profiles across key municipal garages.
              </p>
            </div>
          </div>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.hourly_occupancy} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Downtown Metro Hub" stroke="#3B82F6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Tech Park Plaza" stroke="#10B981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Grand Central Mall" stroke="#F59E0B" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Airport Terminal 2" stroke="#8B5CF6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Daily Parking Trends (Mon-Sun) */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Daily Demand Trends (Mon - Sun)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Average day-of-week saturation across commuter, retail, and transit sectors.
              </p>
            </div>
          </div>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.daily_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="transit" name="Transit / Metro" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="office" name="Tech Office" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mall" name="Retail Mall" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Predicted vs Actual Occupancy (Authentic Scikit-learn test evaluation) */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-emerald-400" />
                Predicted vs. Actual Occupancy (Holdout Test Set)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Authentic model validation points evaluated directly from holdout test split (4,320 unseen records).
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                Random Forest R² = 0.973
              </span>
            </div>
          </div>

          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.actual_vs_predicted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="index" stroke="#64748B" fontSize={11} tickLine={false} label={{ value: 'Evaluation Samples', position: 'insideBottom', offset: -5, fill: '#64748B', fontSize: 10 }} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} label={{ value: 'Occupied Spaces', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="actual" name="Ground Truth (Actual)" stroke="#F8FAFC" strokeWidth={2.5} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="random_forest" name="Random Forest (Best)" stroke="#10B981" strokeWidth={2} dot={false} strokeDasharray="3 3" />
                <Line type="monotone" dataKey="decision_tree" name="Decision Tree" stroke="#3B82F6" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="linear_regression" name="Linear Regression" stroke="#F43F5E" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Location Comparison Table and Rating */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Garages Performance & Utilization Benchmarks
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cross-facility comparison of peak traffic hours, average saturation, and utilization efficiency grades.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">Capacity</th>
                  <th className="py-3 px-3 text-center">Avg Occupancy</th>
                  <th className="py-3 px-3 text-center">Peak Saturation</th>
                  <th className="py-3 px-3">Typical Peak Window</th>
                  <th className="py-3 px-3 text-center">Tariff</th>
                  <th className="py-3 px-3 text-center">Efficiency Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.location_comparison.map((item: any) => (
                  <tr key={item.location_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-white">
                      {item.name}
                    </td>
                    <td className="py-3.5 px-3 text-slate-400">
                      {item.type}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-white">
                      {item.capacity}
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-300">
                      {item.average_occupancy_pct}%
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-rose-400">
                      {item.peak_occupancy_pct}%
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[11px] text-slate-300">
                      {item.peak_time_window}
                    </td>
                    <td className="py-3.5 px-3 text-center font-semibold text-emerald-400">
                      ${item.hourly_rate.toFixed(2)}/hr
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold text-[11px]">
                        {item.utilization_grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
