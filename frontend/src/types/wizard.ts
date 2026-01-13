// ウィザード用型定義

// ステップ定義（1-4）
export type WizardStep = 1 | 2 | 3 | 4;

// 学年の選択肢
export type Grade = "中学1年生" | "中学2年生" | "中学3年生" | "高校1年生";

// 教科の選択肢
export type Subject = "理科" | "数学" | "国語" | "英語";

// AI生成台本のセグメント
export interface ScriptSegment {
  timestamp: string;
  speaker?: string;
  text: string;
  direction?: string; // 演出指示（例: [タイトル表示]）
  isHighlighted?: boolean; // AI最適化ポイントかどうか
  aiNote?: {
    title: string;
    description: string;
  };
}

// AI生成台本データ
export interface GeneratedScript {
  title: string;
  originalText: string;
  segments: ScriptSegment[];
  aiOptimizations: AIOptimization[];
}

// AIの最適化ポイント
export interface AIOptimization {
  type: "understanding_hook" | "visual_effect";
  title: string;
  description: string;
}

// ローディング時のログエントリ
export interface LoadingLog {
  timestamp: string;
  message: string;
}

// ウィザードの状態
export interface WizardState {
  // 現在のステップ
  step: WizardStep;

  // === InputScreen ===
  fileName: string;
  fileContent: string;
  grade: Grade;
  subject: Subject;

  // === ReviewScreen ===
  originalText: string;
  generatedScript: GeneratedScript | null;

  // === LoadingScreen ===
  loadingLogs: LoadingLog[];
  progress: number;
  taskId: string | null;

  // === ResultScreen ===
  videoPath: string | null;

  // === 共通 ===
  isProcessing: boolean;
  error: string | null;
}

// ウィザードのアクション
export interface WizardActions {
  // ステップ操作
  setStep: (step: WizardStep) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;

  // InputScreen
  setFileName: (name: string) => void;
  setFileContent: (content: string) => void;
  setGrade: (grade: Grade) => void;
  setSubject: (subject: Subject) => void;

  // ReviewScreen
  setOriginalText: (text: string) => void;
  setGeneratedScript: (script: GeneratedScript | null) => void;

  // LoadingScreen
  addLoadingLog: (message: string) => void;
  clearLoadingLogs: () => void;
  setProgress: (progress: number) => void;
  setTaskId: (taskId: string | null) => void;

  // ResultScreen
  setVideoPath: (path: string | null) => void;

  // 共通
  setIsProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;

  // リセット
  reset: () => void;
  resetToStep: (step: WizardStep) => void;
}
