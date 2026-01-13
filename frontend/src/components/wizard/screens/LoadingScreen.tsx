import { useEffect, useRef } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { useWizardStore } from "@/stores/wizardStore";

// シミュレーション用のログメッセージ
const LOADING_MESSAGES = [
  "テキスト構造を解析中...",
  "つまずきポイントを特定: '慣性の法則'...",
  "専門用語の平易化処理を開始...",
  "図解用の構成案を作成中...",
  "AIナレーション音声を合成中 (Voice: Gentle Teacher)...",
  "スライド映像をレンダリング中...",
  "最終チェックを実行中...",
];

const LoadingScreen = () => {
  const {
    loadingLogs,
    progress,
    addLoadingLog,
    setProgress,
    clearLoadingLogs,
    setStep,
  } = useWizardStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentLogRef = useRef(0);

  useEffect(() => {
    // ローディングシミュレーションを開始
    clearLoadingLogs();
    setProgress(0);
    currentLogRef.current = 0;

    intervalRef.current = setInterval(() => {
      if (currentLogRef.current < LOADING_MESSAGES.length) {
        addLoadingLog(LOADING_MESSAGES[currentLogRef.current]);
        setProgress(
          Math.min(
            ((currentLogRef.current + 1) / LOADING_MESSAGES.length) * 100,
            100
          )
        );
        currentLogRef.current++;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        // 完了後、ステップ4へ遷移
        setTimeout(() => setStep(4), 500);
      }
    }, 1200);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const cancelGeneration = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setStep(2);
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
        AIが図解スライドと音声を合成しています。
      </p>

      {/* Terminal-style Log Display */}
      <div className="bg-slate-900 rounded-xl p-4 text-left font-mono text-sm h-48 overflow-y-auto shadow-inner border border-slate-700 mb-8">
        {loadingLogs.map((log, i) => (
          <div key={i} className="text-green-400 mb-1 flex gap-2">
            <span className="text-slate-600">[{log.timestamp}]</span>
            <span className="animate-in fade-in duration-500">{log.message}</span>
          </div>
        ))}
        {progress < 100 && <div className="text-white animate-pulse">_</div>}
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
