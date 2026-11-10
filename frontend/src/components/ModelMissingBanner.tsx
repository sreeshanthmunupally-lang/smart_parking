import React from 'react';
import { AlertTriangle, Terminal, RefreshCw } from 'lucide-react';

interface ModelMissingBannerProps {
  missingFiles?: string[];
  onRetry?: () => void;
}

export const ModelMissingBanner: React.FC<ModelMissingBannerProps> = ({ missingFiles, onRetry }) => {
  return (
    <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-6 mb-8 text-amber-200">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h4 className="text-base font-semibold text-amber-300">Trained Machine Learning Models Required</h4>
          <p className="mt-1 text-sm text-amber-200/80 leading-relaxed">
            The platform operates exclusively on real, authentic machine learning models trained on Scikit-learn.
            Prediction and model evaluation features will remain paused until the model artifacts are generated.
          </p>
          {missingFiles && missingFiles.length > 0 && (
            <div className="mt-3 bg-slate-950/70 rounded-lg p-3 text-xs font-mono text-amber-300/90 border border-amber-500/20">
              <span className="text-slate-400">Missing artifacts in models/ folder:</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-400">
                {missingFiles.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-400">
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              <span>python backend/train_models.py</span>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Check Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

