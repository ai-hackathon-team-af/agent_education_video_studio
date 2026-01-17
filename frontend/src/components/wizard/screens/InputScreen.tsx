import { useRef, useCallback } from "react";
import { Upload, ChevronRight, FileText, Loader2, AlertCircle } from "lucide-react";
import { useWizardStore } from "@/stores/wizardStore";
import type { Grade, Subject } from "@/types/wizard";

const GRADES: Grade[] = ["中学3年生", "中学2年生", "中学1年生", "高校1年生"];
const SUBJECTS: Subject[] = ["理科", "数学", "国語", "英語"];

const InputScreen = () => {
  const {
    fileName,
    fileContent,
    grade,
    subject,
    isProcessing,
    error,
    setGrade,
    setSubject,
    uploadFile,
    generateScript,
    setStep,
  } = useWizardStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      await uploadFile(file);
    },
    [uploadFile]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const startGeneration = async () => {
    if (!fileContent) return;
    // 台本生成を開始してステップ2へ
    await generateScript();
    setStep(2);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-6 text-center">
      <h1 className="text-4xl font-bold text-slate-800 mb-4">
        AIプリント解説メーカー
      </h1>
      <p className="text-slate-500 mb-10 text-lg">
        プリントを置くだけで、生徒の「わからない」を解決する動画を作ります。
      </p>

      {/* エラー表示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-left">
          <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* ファイルアップロードエリア */}
      <div
        className={`bg-white p-8 rounded-3xl border-2 border-dashed transition-colors cursor-pointer group mb-6 ${
          isProcessing
            ? "border-blue-300 bg-blue-50"
            : fileName
            ? "border-green-300 bg-green-50"
            : "border-blue-200 hover:border-blue-400"
        }`}
        onClick={!isProcessing ? handleClick : undefined}
        onDrop={!isProcessing ? handleDrop : undefined}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <div className="flex flex-col items-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
              isProcessing
                ? "bg-blue-100"
                : fileName
                ? "bg-green-100"
                : "bg-blue-50 group-hover:bg-blue-100"
            }`}
          >
            {isProcessing ? (
              <Loader2 className="text-blue-500 animate-spin" size={32} />
            ) : fileName ? (
              <FileText className="text-green-500" size={32} />
            ) : (
              <Upload className="text-blue-500" size={32} />
            )}
          </div>
          <p className="text-lg font-medium text-slate-700">
            {isProcessing
              ? "ファイルを処理中..."
              : fileName || "ファイルをドラッグ＆ドロップ、またはクリックして選択"}
          </p>
          <p className="text-sm text-slate-400 mt-2">PDF, Word (.docx) 対応</p>
        </div>
      </div>

      {/* キャラクター説明 */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-1">
              動画のキャラクターについて
            </p>
            <p className="text-sm text-amber-700">
              生成される動画では「ずんだもん」「めたん」「つむぎ」の3キャラクターが解説を行います。
              VOICEVOXの音声合成を使用した楽しい掛け合い形式の解説動画が作成されます。
            </p>
          </div>
        </div>
      </div>

      {/* ファイル内容プレビュー */}
      {fileContent && (
        <div className="mb-8 text-left">
          <label className="block text-sm font-semibold text-slate-600 mb-2">
            抽出されたテキスト（プレビュー）
          </label>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-40 overflow-y-auto">
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {fileContent.slice(0, 500)}
              {fileContent.length > 500 && "..."}
            </p>
          </div>
        </div>
      )}

      {/* 学年・教科選択 */}
      <div className="flex gap-4 mb-10">
        <div className="flex-1 text-left">
          <label className="block text-sm font-semibold text-slate-600 mb-2">
            学年
          </label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value as Grade)}
            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 text-left">
          <label className="block text-sm font-semibold text-slate-600 mb-2">
            教科
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as Subject)}
            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 生成開始ボタン */}
      <button
        onClick={startGeneration}
        disabled={!fileContent || isProcessing}
        className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
          fileContent && !isProcessing
            ? "bg-blue-600 hover:bg-blue-700 active:scale-95"
            : "bg-slate-300 cursor-not-allowed"
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            処理中...
          </>
        ) : (
          <>
            台本を生成する <ChevronRight size={20} />
          </>
        )}
      </button>
    </div>
  );
};

export default InputScreen;
