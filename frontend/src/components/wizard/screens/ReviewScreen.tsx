import { ArrowLeft, CheckCircle, FileText, Cpu, Lightbulb, Loader2 } from "lucide-react";
import { useWizardStore } from "@/stores/wizardStore";

const ReviewScreen = () => {
  const {
    originalText,
    generatedScript,
    isProcessing,
    setStep,
    startVideoGeneration,
  } = useWizardStore();

  const goBack = () => setStep(1);

  const approveDraft = async () => {
    setStep(3);
    await startVideoGeneration();
  };

  // 台本がない場合
  if (!generatedScript) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-6">
        <div className="text-center py-12">
          <p className="text-slate-500">台本を生成中...</p>
        </div>
      </div>
    );
  }

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
              AIが生成した台本を確認してください。
            </p>
          </div>
        </div>
        <button
          onClick={approveDraft}
          disabled={isProcessing}
          className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              処理中...
            </>
          ) : (
            <>
              <CheckCircle size={20} /> この内容で動画化する
            </>
          )}
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
            <p className="whitespace-pre-wrap">{originalText}</p>
          </div>
        </div>

        {/* Right: AI Generated Script */}
        <div className="bg-white rounded-2xl p-6 border-2 border-blue-100 overflow-y-auto relative shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-blue-600 text-sm font-bold uppercase tracking-wider">
            <Cpu size={16} /> AI生成台本
          </div>

          {/* Script Title */}
          <div className="mb-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-lg font-bold text-blue-900">{generatedScript.title}</p>
            <p className="text-sm text-blue-600 mt-1">
              推定再生時間: {generatedScript.estimated_duration}
            </p>
          </div>

          {/* Script Sections */}
          <div className="space-y-6">
            {generatedScript.sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="border-l-2 border-slate-200 pl-4">
                <p className="text-sm font-bold text-slate-500 mb-3">
                  {section.section_name}
                </p>
                {section.segments.map((segment, segmentIndex) => (
                  <div key={segmentIndex} className="mb-4">
                    <div className="flex gap-4">
                      <div className="w-16 text-slate-400 text-xs font-mono pt-1 flex-shrink-0">
                        {segment.speaker === "ずんだもん" ? "🟢" : "🔵"}{" "}
                        {segment.speaker}
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-800">{segment.text}</p>
                        {segment.expression && segment.expression !== "normal" && (
                          <p className="text-xs text-slate-400 mt-1">
                            表情: {segment.expression}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* AI Note */}
          <div className="mt-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3">
            <div className="bg-amber-400 p-1.5 rounded-full h-fit mt-0.5">
              <Lightbulb size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800 mb-1">
                AIの生成ポイント
              </p>
              <p className="text-sm text-amber-700 leading-relaxed">
                元のテキストを基に、会話形式で分かりやすく解説する台本を生成しました。
                ずんだもんとメタンの掛け合いで楽しく学べる内容になっています。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewScreen;
