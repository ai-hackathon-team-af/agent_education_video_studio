import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { useWizardStore } from "@/stores/wizardStore";

const LoadingScreen = () => {
  const {
    loadingLogs,
    progress,
    error,
    setStep: _setStep,
    resetToStep,
  } = useWizardStore();

  const cancelGeneration = () => {
    resetToStep(2);
  };

  return (
    <div className="max-w-xl mx-auto py-24 px-6 text-center">
      {/* Progress Circle */}
      <div className="mb-12 relative flex justify-center">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 border-4 border-blue-100 rounded-full" />
        </div>
        <div className="relative">
          <Loader2
            className="text-blue-500 animate-spin w-48 h-48"
            strokeWidth={1.5}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-blue-600">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-800 mb-2">動画を生成中...</h2>
      <p className="text-slate-500 mb-8 font-medium">
        VOICEVOXで音声を合成し、動画を生成しています。
      </p>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-left">
          <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Terminal-style Log Display */}
      <div className="bg-slate-900 rounded-xl p-4 text-left font-mono text-sm h-48 overflow-y-auto shadow-inner border border-slate-700 mb-8">
        {loadingLogs.map((log, i) => (
          <div key={i} className="text-green-400 mb-1 flex gap-2">
            <span className="text-slate-600">[{log.timestamp}]</span>
            <span className="animate-in fade-in duration-500">{log.message}</span>
          </div>
        ))}
        {!error && progress < 100 && (
          <div className="text-white animate-pulse">_</div>
        )}
      </div>

      {/* Cancel Button */}
      <button
        onClick={cancelGeneration}
        className="text-slate-400 hover:text-slate-600 flex items-center gap-2 mx-auto font-bold transition-colors"
      >
        <ArrowLeft size={18} /> 生成を中止して台本に戻る
      </button>
    </div>
  );
};

export default LoadingScreen;
