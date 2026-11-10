import React, { useState } from 'react';
import {
  BrainCircuit,
  Calendar,
  Clock,
  MapPin,
  CloudSun,
  Flame,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { LocationItem, PredictionResult } from '../types';
import { predictParking } from '../services/api';
import { StatusBadge } from './StatusBadge';

interface ModulePredictionProps {
  locations: LocationItem[];
  selectedLocationId?: string;
  onNavigateTab: (tab: string) => void;
}

export const ModulePrediction: React.FC<ModulePredictionProps> = ({
  locations,
  selectedLocationId,
  onNavigateTab
}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [locationId, setLocationId] = useState<string>(selectedLocationId || (locations[0]?.location_id || 'LOC001'));
  const [date, setDate] = useState<string>(defaultDateStr);
  const [time, setTime] = useState<string>('14:30');
  const [modelName, setModelName] = useState<string>('Best Model');
  const [weatherCondition, setWeatherCondition] = useState<string>('Clear');
  const [temperatureC, setTemperatureC] = useState<number>(24.0);
  const [nearbyEvent, setNearbyEvent] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await predictParking({
        location_id: locationId,
        date,
        time,
        model_name: modelName,
        temperature_c: Number(temperatureC),
        weather_condition: weatherCondition,
        nearby_event: nearbyEvent
      });
      setPrediction(res);
    } catch (err: any) {
      setError(err.message || 'Failed to generate parking prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <BrainCircuit className="w-3.5 h-3.5" />
          Module 2: Machine Learning Inference
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Parking Availability Prediction
        </h1>
        <p className="mt-1 text-slate-300 text-sm max-w-3xl leading-relaxed">
          Forecast upcoming parking occupancy using authentic Scikit-learn regressors trained on 21,600 historical telemetry records.
          Compare predictions across Linear Regression, Decision Tree, and the best-performing Random Forest Regressor.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Prediction Form (Left Col 5) */}
        <div className="lg:col-span-5">
          <div className="glass-panel rounded-3xl p-6 sm:p-7">
            <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Configure Target Arrival
            </h2>

            <form onSubmit={handlePredict} className="space-y-4">
              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  Parking Location
                </label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {locations.map((loc) => (
                    <option key={loc.location_id} value={loc.location_id}>
                      {loc.name} ({loc.capacity} spaces)
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    Expected Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Algorithm Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  Model Selection
                </label>
                <select
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="Best Model">Best Model: Random Forest (R² = 0.973, Lowest RMSE)</option>
                  <option value="Random Forest">Random Forest Regressor (100 Trees)</option>
                  <option value="Decision Tree">Decision Tree Regressor (Depth 12)</option>
                  <option value="Linear Regression">Linear Regression (OLS Baseline)</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Selects the best-performing model automatically according to holdout test set metrics.
                </p>
              </div>

              {/* Weather & Temperature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <CloudSun className="w-3.5 h-3.5 text-sky-400" />
                    Weather Condition
                  </label>
                  <select
                    value={weatherCondition}
                    onChange={(e) => setWeatherCondition(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="Clear">Clear</option>
                    <option value="Sunny">Sunny</option>
                    <option value="Cloudy">Cloudy</option>
                    <option value="Rainy">Rainy</option>
                    <option value="Overcast">Overcast</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    Temperature ({temperatureC}°C)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="42"
                    step="0.5"
                    value={temperatureC}
                    onChange={(e) => setTemperatureC(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer mt-2"
                  />
                </div>
              </div>

              {/* Special Event Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={nearbyEvent}
                    onChange={(e) => setNearbyEvent(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">Nearby Special Event / Festival</span>
                    <span className="text-[11px] text-slate-400 block">
                      Accounts for sports matches, concerts, or holiday conventions.
                    </span>
                  </div>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Computing Scikit-learn Inference...</span>
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="w-4 h-4" />
                      <span>Run Availability Prediction</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Prediction Results (Right Col 7) */}
        <div className="lg:col-span-7">
          {error && (
            <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-5 text-rose-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-300">Prediction Error</h4>
                <p className="text-xs text-rose-200/80 mt-1">{error}</p>
              </div>
            </div>
          )}

          {!prediction && !error && (
            <div className="glass-panel rounded-3xl p-10 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Ready for Machine Learning Inference</h3>
              <p className="mt-2 text-xs text-slate-400 max-w-md leading-relaxed">
                Configure your target parking location, expected arrival date, and time on the left panel, then click
                "Run Availability Prediction" to calculate real model-driven occupancy estimates.
              </p>
            </div>
          )}

          {prediction && (
            <div className="space-y-6 animate-fadeIn">
              {/* Main Prediction Summary Card */}
              <div className="glass-panel rounded-3xl p-6 sm:p-7 border-l-4 border-l-blue-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Target: {prediction.target_timestamp} ({prediction.day_of_week_name})
                    </span>
                    <h3 className="text-xl font-bold text-white mt-1.5">{prediction.location_name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={prediction.demand_level} size="lg" />
                  </div>
                </div>

                {/* 4 Core Output Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
                    <p className="text-[11px] text-slate-400 uppercase font-medium">Expected Occupied</p>
                    <p className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">
                      {prediction.predicted_occupied}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">vehicles</p>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
                    <p className="text-[11px] text-slate-400 uppercase font-medium">Expected Available</p>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                      {prediction.predicted_available}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">vacant slots</p>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
                    <p className="text-[11px] text-slate-400 uppercase font-medium">Occupancy Rate</p>
                    <p className="text-2xl sm:text-3xl font-black text-white mt-1">
                      {prediction.occupancy_percentage}%
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">of {prediction.total_capacity} total</p>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
                    <p className="text-[11px] text-slate-400 uppercase font-medium">Demand Level</p>
                    <p className={`text-2xl sm:text-3xl font-black mt-1 ${
                      prediction.demand_level === 'High' ? 'text-rose-400' :
                      prediction.demand_level === 'Medium' ? 'text-sky-400' : 'text-emerald-400'
                    }`}>
                      {prediction.demand_level}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">traffic intensity</p>
                  </div>
                </div>

                {/* Progress bar visual */}
                <div className="space-y-1.5 mb-6">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Facility Capacity Saturation</span>
                    <span className="text-white font-bold">{prediction.occupancy_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        prediction.occupancy_percentage >= 80 ? 'bg-gradient-to-r from-amber-500 to-rose-500' :
                        prediction.occupancy_percentage >= 50 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                        'bg-gradient-to-r from-emerald-500 to-teal-400'
                      }`}
                      style={{ width: `${Math.min(100, prediction.occupancy_percentage)}%` }}
                    />
                  </div>
                </div>

                {/* Recommendation Box */}
                <div className="bg-blue-950/30 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
                  <Award className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        SmartPark AI Recommendation
                      </h4>
                      <button
                        onClick={() => onNavigateTab('reservations')}
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        <span>Reserve Slot</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {prediction.recommendation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Model Comparison Table (All 3 Models) */}
              <div className="glass-panel rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-400" />
                      Multi-Model Algorithmic Comparison
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Empirical predictions and verified test-set accuracy metrics across all 3 trained models.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Model</th>
                        <th className="py-2.5 px-3 text-center">Predicted Occupied</th>
                        <th className="py-2.5 px-3 text-center">Predicted Available</th>
                        <th className="py-2.5 px-3 text-center">Occupancy %</th>
                        <th className="py-2.5 px-3 text-center">MAE</th>
                        <th className="py-2.5 px-3 text-center">RMSE</th>
                        <th className="py-2.5 px-3 text-center">R² Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {Object.entries(prediction.all_models_comparison).map(([name, item]) => {
                        const isBest = name === 'Random Forest';
                        const isChosen = name === prediction.selected_model;
                        return (
                          <tr
                            key={name}
                            className={`transition-colors ${
                              isChosen ? 'bg-blue-900/20' : 'hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="py-3 px-3 font-medium text-white flex items-center gap-2">
                              {name}
                              {isBest && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                                  BEST
                                </span>
                              )}
                              {isChosen && (
                                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-bold">
                                  SELECTED
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-rose-400">
                              {item.predicted_occupied}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-emerald-400">
                              {item.predicted_available}
                            </td>
                            <td className="py-3 px-3 text-center text-white">
                              {item.occupancy_percentage}%
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-slate-300">
                              {item.mae}
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-slate-300">
                              {item.rmse}
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">
                              {item.r2_score}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
