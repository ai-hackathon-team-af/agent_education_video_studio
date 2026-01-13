import { ArrowLeft, CheckCircle, FileText, Cpu, Lightbulb } from "lucide-react";
import { useWizardStore } from "@/stores/wizardStore";

const ReviewScreen = () => {
  const { setStep } = useWizardStore();

  const goBack = () => setStep(1);
  const approveDraft = () => setStep(3);

  return (
    <div className="max-w-6xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={goBack}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
            title="最初に戻る"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">構成・台本の確認</h2>
            <p className="text-slate-500">
              AIが「つまずきポイント」を補強した特別版です。
            </p>
          </div>
        </div>
        <button
          onClick={approveDraft}
          className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <CheckCircle size={20} /> この内容で動画化する
        </button>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[650px]">
        {/* Left: Original Text */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4 text-slate-500 text-sm font-bold uppercase tracking-wider">
            <FileText size={16} /> 元の教材テキスト
          </div>
          <div className="prose prose-slate max-w-none text-slate-600">
            <p className="text-lg font-bold text-slate-800">
              第2章：物体の運動と力
            </p>
            <p className="bg-yellow-100 px-1 border-b-2 border-yellow-400 text-slate-900">
              物体に力がはたらかないとき、または、はたらいている力がつり合っているとき、静止している物体は静止し続け、動いている物体はそのままの速さで等速直線運動を続ける。これを慣性の法則という。
            </p>
            <p>慣性の大きさは物体の質量に関係しており...</p>
            <div className="mt-4 p-4 border rounded-lg bg-white border-slate-200 text-center text-slate-400 italic">
              [ここに斜面を転がるボールの図解]
            </div>
            <p className="mt-4">
              具体例としては、電車が急停車したときに体が前に倒れそうになる現象が挙げられる。
            </p>
          </div>
        </div>

        {/* Right: AI Agentic Script */}
        <div className="bg-white rounded-2xl p-6 border-2 border-blue-100 overflow-y-auto relative shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-blue-600 text-sm font-bold uppercase tracking-wider">
            <Cpu size={16} /> AI生成台本 (教育的最適化済み)
          </div>

          <div className="space-y-6">
            {/* Segment 1 */}
            <div className="flex gap-4">
              <div className="w-12 text-slate-400 text-xs font-mono pt-1">
                00:00
              </div>
              <div className="flex-1">
                <p className="text-slate-500 italic text-xs mb-1">
                  [タイトル表示：身の回りの慣性の法則]
                </p>
                <p className="text-slate-800">
                  こんにちは！今日は理科の「慣性の法則」について学んでいきましょう。
                </p>
              </div>
            </div>

            {/* Segment 2 - Highlighted */}
            <div className="relative group">
              <div className="absolute -left-2 top-0 bottom-0 w-1 bg-blue-500 rounded-full" />
              <div className="flex gap-4 bg-blue-50/50 p-3 rounded-r-xl border border-blue-100">
                <div className="w-12 text-blue-400 text-xs font-mono pt-1">
                  00:15
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-blue-900 mb-1">
                    言葉の意味をかみ砕いて説明
                  </p>
                  <p className="text-slate-800">
                    教科書には難しい言葉が並んでいますが、一言で言うと「物体は今の状態を続けたいという、わがままな性質を持っている」ということです。
                  </p>
                </div>
              </div>

              {/* AI Note */}
              <div className="mt-3 ml-12 bg-amber-50 border border-amber-200 p-3 rounded-2xl flex gap-3 shadow-sm animate-in fade-in slide-in-from-left-2">
                <div className="bg-amber-400 p-1.5 rounded-full h-fit mt-0.5">
                  <Lightbulb size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-800 mb-0.5">
                    AIの判断：難易度調整
                  </p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    「等速直線運動」という用語の前に「わがままな性質」と比喩を使うことで、直感的な理解を促します。
                  </p>
                </div>
              </div>
            </div>

            {/* Segment 3 */}
            <div className="flex gap-4">
              <div className="w-12 text-slate-400 text-xs font-mono pt-1">
                00:45
              </div>
              <div className="flex-1">
                <p className="text-slate-500 italic text-xs mb-1">
                  [アニメーション：急ブレーキをかけるバス]
                </p>
                <p className="text-slate-800">
                  例えば、みんながバスに乗っている時を想像してみて。急にブレーキがかかると「おっと！」って体が前にいくよね？
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewScreen;
