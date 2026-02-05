import { useRef } from "react";
import {
  CheckCircle,
  PlayCircle,
  RefreshCw,
  Home,
  Lightbulb,
  Download,
  Sparkles,
} from "lucide-react";
import { useWizardStore } from "@/stores/wizardStore";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const ResultScreen = () => {
  const { videoPath, aiOptimizations, generatedScript, setStep: _setStep, reset, resetToStep } =
    useWizardStore();
  const videoRef = useRef<HTMLVideoElement>(null);

  const regenerate = () => {
    resetToStep(3);
  };

  const goToReview = () => {
    resetToStep(2);
  };

  const startOver = () => reset();

  const handleDownload = () => {
    if (videoPath) {
      const link = document.createElement("a");
      link.href = `${API_BASE_URL}${videoPath}`;
      link.download = generatedScript?.title || "generated-video.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const videoUrl = videoPath ? `${API_BASE_URL}${videoPath}` : null;

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 text-green-600 p-2 rounded-full shadow-sm">
            <CheckCircle size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              動画が完成しました！
            </h2>
            {generatedScript && (
              <p className="text-slate-500 text-sm">{generatedScript.title}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={regenerate}
            className="flex items-center gap-2 text-slate-500 font-bold hover:bg-slate-100 px-4 py-2 rounded-xl transition-all text-sm"
          >
            <RefreshCw size={18} /> もう一度生成
          </button>
          <button
            onClick={startOver}
            className="flex items-center gap-2 bg-slate-800 text-white font-bold hover:bg-slate-900 px-5 py-2 rounded-xl transition-all text-sm shadow-md"
          >
            <Home size={18} /> 最初から別のを作る
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Main Video Section */}
        <div className="bg-white p-4 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="aspect-video bg-slate-900 rounded-[2rem] overflow-hidden relative group">
            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="w-full h-full object-contain"
              >
                お使いのブラウザは動画再生をサポートしていません。
              </video>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircle
                  size={80}
                  className="text-white/80 group-hover:scale-110 transition-transform cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* Highlighted AI Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 text-amber-200">
              <Sparkles size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-amber-400 p-2 rounded-2xl shadow-md shadow-amber-200 text-white">
                  <Lightbulb size={24} />
                </div>
                <h3 className="text-2xl font-black text-amber-900 tracking-tight">
                  AIの授業最適化ポイント
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {aiOptimizations.length > 0 ? (
                  aiOptimizations.map((opt, index) => (
                    <div
                      key={index}
                      className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white"
                    >
                      <p className="text-xs font-bold text-amber-600 mb-2 uppercase tracking-widest">
                        {opt.type === "understanding_hook"
                          ? "理解のフック"
                          : "視覚演出"}
                      </p>
                      <p className="text-lg font-bold text-amber-950 leading-tight">
                        {opt.title}
                      </p>
                      <p className="text-sm text-amber-800 mt-2">
                        {opt.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white">
                      <p className="text-xs font-bold text-amber-600 mb-2 uppercase tracking-widest">
                        会話形式
                      </p>
                      <p className="text-lg font-bold text-amber-950 leading-tight">
                        ずんだもんとメタンの掛け合い
                      </p>
                      <p className="text-sm text-amber-800 mt-2">
                        楽しい会話形式で、難しい内容も分かりやすく解説します。
                      </p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white">
                      <p className="text-xs font-bold text-amber-600 mb-2 uppercase tracking-widest">
                        音声合成
                      </p>
                      <p className="text-lg font-bold text-amber-950 leading-tight">
                        VOICEVOXによる自然な音声
                      </p>
                      <p className="text-sm text-amber-800 mt-2">
                        高品質な音声合成で、聞き取りやすい解説動画を生成しました。
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={handleDownload}
              disabled={!videoPath}
              className="flex-1 bg-blue-600 text-white rounded-[2rem] font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-[0.98] flex flex-col items-center justify-center p-6 border-b-4 border-blue-800 disabled:bg-slate-300 disabled:border-slate-400 disabled:cursor-not-allowed"
            >
              <Download size={32} className="mb-2" />
              <span className="text-xl">PCに保存</span>
              <span className="text-blue-200 text-xs font-normal">
                MP4 (1080p)
              </span>
            </button>
            <button
              onClick={goToReview}
              className="py-4 bg-white border-2 border-slate-200 text-slate-500 rounded-[1.5rem] font-bold flex items-center justify-center gap-3 hover:border-slate-400 hover:text-slate-700 transition-all shadow-sm text-sm"
            >
              <RefreshCw size={18} /> 台本を修正する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultScreen;
