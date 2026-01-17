import { Upload, ChevronRight, AlertCircle } from "lucide-react";
import { useWizardStore } from "@/stores/wizardStore";
import type { Grade, Subject } from "@/types/wizard";

const GRADES: Grade[] = ["中学3年生", "中学2年生", "中学1年生", "高校1年生"];
const SUBJECTS: Subject[] = ["理科", "数学", "国語", "英語"];

const InputScreen = () => {
  const { fileName, grade, subject, setFileName, setGrade, setSubject, setStep } =
    useWizardStore();

  const handleFileClick = () => {
    // デモ用：クリックでファイル名を設定
    setFileName("中3物理_第2章_慣性の法則.pdf");
  };

  const startGeneration = () => {
    if (!fileName) return;
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

      {/* ファイルアップロードエリア */}
      <div
        className="bg-white p-8 rounded-3xl border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors cursor-pointer group mb-6"
        onClick={handleFileClick}
      >
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
            <Upload className="text-blue-500" size={32} />
          </div>
          <p className="text-lg font-medium text-slate-700">
            {fileName || "ファイルをドラッグ＆ドロップ、またはクリックして選択"}
          </p>
          <p className="text-sm text-slate-400 mt-2">PDF, Word (最大 20MB)</p>
        </div>
      </div>

      {/* キャラクター説明 */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 text-left">
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
        disabled={!fileName}
        className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
          fileName
            ? "bg-blue-600 hover:bg-blue-700 active:scale-95"
            : "bg-slate-300 cursor-not-allowed"
        }`}
      >
        動画生成をスタート <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default InputScreen;
