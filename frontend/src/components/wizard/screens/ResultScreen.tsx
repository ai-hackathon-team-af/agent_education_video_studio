import {
  CheckCircle,
  PlayCircle,
  Maximize,
  RefreshCw,
  Home,
  Lightbulb,
  Download,
  Sparkles,
} from "lucide-react";
import { useWizardStore } from "@/stores/wizardStore";

const ResultScreen = () => {
  const { setStep, reset } = useWizardStore();

  const regenerate = () => setStep(3);
  const goToReview = () => setStep(2);
  const startOver = () => reset();

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
            <div className="absolute inset-0 flex items-center justify-center">
              <PlayCircle
                size={80}
                className="text-white/80 group-hover:scale-110 transition-transform cursor-pointer"
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center gap-4">
              <div className="h-1 bg-white/20 flex-1 rounded-full relative">
                <div className="absolute inset-y-0 left-0 w-1/4 bg-blue-500 rounded-full" />
              </div>
              <span className="text-white text-xs font-mono font-bold">
                00:45 / 03:20
              </span>
              <div className="w-8 h-8 flex items-center justify-center text-white">
                <Maximize size={18} />
              </div>
            </div>
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
                <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white">
                  <p className="text-xs font-bold text-amber-600 mb-2 uppercase tracking-widest">
                    理解のフック
                  </p>
                  <p className="text-lg font-bold text-amber-950 leading-tight">
                    「慣性」を日常の「わがまま」に擬人化
                  </p>
                  <p className="text-sm text-amber-800 mt-2">
                    抽象的な等速直線運動を、生徒の感情と結びつけて定着させます。
                  </p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white">
                  <p className="text-xs font-bold text-amber-600 mb-2 uppercase tracking-widest">
                    視覚演出
                  </p>
                  <p className="text-lg font-bold text-amber-950 leading-tight">
                    身近な「バスの急ブレーキ」を図解
                  </p>
                  <p className="text-sm text-amber-800 mt-2">
                    電車の例よりも日常的なシーンを選ぶことで、放課後の対話を誘発します。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button className="flex-1 bg-blue-600 text-white rounded-[2rem] font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-[0.98] flex flex-col items-center justify-center p-6 border-b-4 border-blue-800">
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
