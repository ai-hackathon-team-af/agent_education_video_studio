import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  Cpu,
  Lightbulb,
  Loader2,
  Image,
  RefreshCw,
  Edit3,
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
} from "lucide-react";
import { useWizardStore } from "@/stores/wizardStore";
import { scriptApi } from "@/api/scripts";

// Assets are served from the same origin, so use relative URLs
const ASSETS_BASE_URL = "";

const ReviewScreen = () => {
  const {
    originalText,
    generatedScript,
    isProcessing,
    setStep,
    startVideoGeneration,
    updateSegment,
    addSegment,
    deleteSegment,
  } = useWizardStore();

  // 背景画像の状態
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [isLoadingBackground, setIsLoadingBackground] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [backgroundError, setBackgroundError] = useState<string | null>(null);
  const hasGeneratedBackground = useRef(false);

  // プロンプト編集の状態
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [editedPrompt, setEditedPrompt] = useState<string>("");
  const [showPromptEditor, setShowPromptEditor] = useState(false);

  // 台本編集モード
  const [isEditingScript, setIsEditingScript] = useState(false);

  const goBack = () => setStep(1);

  const approveDraft = async () => {
    setStep(3);
    await startVideoGeneration();
  };

  // 台本データから背景画像を生成
  const generateBackground = async () => {
    if (!generatedScript) return;

    setIsLoadingBackground(true);
    setBackgroundError(null);
    try {
      const response = await scriptApi.regenerateBackground(
        generatedScript.theme,
        generatedScript as unknown as Record<string, unknown>
      );
      if (response.exists && response.background_url) {
        setBackgroundUrl(`${ASSETS_BASE_URL}${response.background_url}?t=${Date.now()}`);
      }
      // プロンプトを保存
      if (response.prompt) {
        setCurrentPrompt(response.prompt);
        setEditedPrompt(response.prompt);
      }
    } catch (error) {
      console.error("背景画像の生成に失敗:", error);
      setBackgroundError("背景画像の生成に失敗しました");
    } finally {
      setIsLoadingBackground(false);
    }
  };

  // 背景画像を再生成
  const regenerateBackground = async (useCustomPrompt = false) => {
    if (!generatedScript?.theme) return;

    setIsRegenerating(true);
    setBackgroundError(null);
    try {
      // カスタムプロンプトを使用するかどうか
      const customPrompt = useCustomPrompt && editedPrompt !== currentPrompt
        ? editedPrompt
        : undefined;

      const response = await scriptApi.regenerateBackground(
        generatedScript.theme,
        generatedScript as unknown as Record<string, unknown>,
        undefined,
        customPrompt
      );
      if (response.exists && response.background_url) {
        // キャッシュ回避のためにタイムスタンプを追加
        setBackgroundUrl(
          `${ASSETS_BASE_URL}${response.background_url}?t=${Date.now()}`
        );
      }
      // プロンプトを更新
      if (response.prompt) {
        setCurrentPrompt(response.prompt);
        setEditedPrompt(response.prompt);
      }
    } catch (error) {
      console.error("背景画像の再生成に失敗:", error);
      setBackgroundError("背景画像の再生成に失敗しました");
    } finally {
      setIsRegenerating(false);
    }
  };

  // 台本が読み込まれたら背景を生成（初回のみ）
  useEffect(() => {
    if (generatedScript && !hasGeneratedBackground.current && !isLoadingBackground) {
      hasGeneratedBackground.current = true;
      generateBackground();
    }
  }, [generatedScript]);

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
            <h2 className="text-2xl font-bold text-slate-800">
              構成・台本の確認
            </h2>
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

      {/* Background Preview Section */}
      <div className="mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-purple-600 text-sm font-bold uppercase tracking-wider">
            <Image size={16} /> 背景画像プレビュー
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPromptEditor(!showPromptEditor)}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-purple-600 text-sm font-medium rounded-lg transition-all flex items-center gap-2 border border-purple-200"
            >
              <Edit3 size={16} />
              プロンプト編集
              {showPromptEditor ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button
              onClick={() => regenerateBackground(false)}
              disabled={isRegenerating || isLoadingBackground}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 disabled:bg-purple-300 disabled:cursor-not-allowed"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  生成中...
                </>
              ) : (
                <>
                  <RefreshCw size={16} /> 背景を再生成
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Background Image */}
          <div className="w-80 h-44 bg-slate-200 rounded-xl overflow-hidden flex-shrink-0 relative">
            {isLoadingBackground ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-400" size={32} />
              </div>
            ) : backgroundUrl ? (
              <img
                src={backgroundUrl}
                alt="背景プレビュー"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Image size={32} className="mx-auto mb-2" />
                  <p className="text-sm">背景画像なし</p>
                </div>
              </div>
            )}
          </div>

          {/* Background Info */}
          <div className="flex-1">
            <p className="text-sm text-slate-600 mb-2">
              <span className="font-medium">タイトル:</span> {generatedScript.title}
            </p>
            <p className="text-sm text-slate-500 leading-relaxed">
              この背景画像は、台本のタイトルに基づいてAIが自動生成しました。
              イメージに合わない場合は「背景を再生成」ボタンで別の画像を生成できます。
            </p>
            {backgroundError && (
              <p className="text-sm text-red-500 mt-2">{backgroundError}</p>
            )}
          </div>
        </div>

        {/* Prompt Editor */}
        {showPromptEditor && (
          <div className="mt-4 pt-4 border-t border-purple-200">
            <label className="block text-sm font-medium text-purple-700 mb-2">
              画像生成プロンプト（英語）
            </label>
            <textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              placeholder="背景画像生成用のプロンプトを入力..."
              className="w-full h-24 p-3 text-sm border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-slate-500">
                プロンプトを編集して「編集したプロンプトで生成」をクリックすると、カスタムプロンプトで背景が生成されます。
              </p>
              <button
                onClick={() => regenerateBackground(true)}
                disabled={isRegenerating || isLoadingBackground || !editedPrompt.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 disabled:bg-indigo-300 disabled:cursor-not-allowed"
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    生成中...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} /> 編集したプロンプトで生成
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[500px]">
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-blue-600 text-sm font-bold uppercase tracking-wider">
              <Cpu size={16} /> AI生成台本
            </div>
            <button
              onClick={() => setIsEditingScript(!isEditingScript)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                isEditingScript
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Edit3 size={14} />
              {isEditingScript ? "編集を終了" : "台本を編集"}
            </button>
          </div>

          {/* Script Title */}
          <div className="mb-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-lg font-bold text-blue-900">
              {generatedScript.title}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              推定再生時間: {generatedScript.estimated_duration}
            </p>
          </div>

          {/* Script Sections */}
          <div className="space-y-6">
            {generatedScript.sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className={`border-l-2 ${isEditingScript ? "border-blue-200" : "border-slate-200"} pl-4`}>
                <p className="text-sm font-bold text-slate-500 mb-3">
                  {section.section_name}
                </p>
                {section.segments.map((segment, segmentIndex) =>
                  isEditingScript ? (
                    <div key={segmentIndex} className="mb-3 bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <select
                          value={segment.speaker}
                          onChange={(e) =>
                            updateSegment(sectionIndex, segmentIndex, {
                              speaker: e.target.value,
                            })
                          }
                          className="text-xs px-2 py-1 border border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-blue-400 outline-none"
                        >
                          <option value="ずんだもん">ずんだもん</option>
                          <option value="めたん">めたん</option>
                          <option value="つむぎ">つむぎ</option>
                        </select>
                        <select
                          value={segment.expression}
                          onChange={(e) =>
                            updateSegment(sectionIndex, segmentIndex, {
                              expression: e.target.value,
                            })
                          }
                          className="text-xs px-2 py-1 border border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-blue-400 outline-none"
                        >
                          <option value="normal">normal</option>
                          <option value="happy">happy</option>
                          <option value="angry">angry</option>
                          <option value="sad">sad</option>
                          <option value="surprised">surprised</option>
                        </select>
                        <div className="flex-1" />
                        {section.segments.length > 1 && (
                          <button
                            onClick={() => deleteSegment(sectionIndex, segmentIndex)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="このセリフを削除"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <textarea
                        value={segment.text}
                        onChange={(e) =>
                          updateSegment(sectionIndex, segmentIndex, {
                            text: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full text-sm text-slate-800 border border-slate-200 rounded-md p-2 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 outline-none resize-none bg-white"
                      />
                      <div className="flex justify-center mt-1">
                        <button
                          onClick={() => addSegment(sectionIndex, segmentIndex)}
                          className="text-xs text-slate-400 hover:text-blue-500 hover:bg-blue-50 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                          title="この下にセリフを追加"
                        >
                          <Plus size={12} /> セリフ追加
                        </button>
                      </div>
                    </div>
                  ) : (
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
                  )
                )}
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
