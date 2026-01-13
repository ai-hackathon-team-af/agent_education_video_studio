// ウィザード用型定義
import type { ComedyScript } from "./index";

// ステップ定義（1-4）
export type WizardStep = 1 | 2 | 3 | 4;

// 学年の選択肢
export type Grade = "中学1年生" | "中学2年生" | "中学3年生" | "高校1年生";

// 教科の選択肢
export type Subject = "理科" | "数学" | "国語" | "英語";

// ローディング時のログエントリ
export interface LoadingLog {
  timestamp: string;
  message: string;
}

// AIの最適化ポイント（ResultScreen用）
export interface AIOptimization {
  type: "understanding_hook" | "visual_effect";
  title: string;
  description: string;
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
  generatedScript: ComedyScript | null;

  // === LoadingScreen ===
  loadingLogs: LoadingLog[];
  progress: number;
  taskId: string | null;

  // === ResultScreen ===
  videoPath: string | null;
  aiOptimizations: AIOptimization[];

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
  uploadFile: (file: File) => Promise<void>;

  // ReviewScreen
  setOriginalText: (text: string) => void;
  setGeneratedScript: (script: ComedyScript | null) => void;
  generateScript: () => Promise<void>;

  // LoadingScreen
  addLoadingLog: (message: string) => void;
  clearLoadingLogs: () => void;
  setProgress: (progress: number) => void;
  setTaskId: (taskId: string | null) => void;
  startVideoGeneration: () => Promise<void>;
  pollVideoStatus: () => Promise<void>;

  // ResultScreen
  setVideoPath: (path: string | null) => void;
  setAiOptimizations: (optimizations: AIOptimization[]) => void;

  // 共通
  setIsProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;

  // リセット
  reset: () => void;
  resetToStep: (step: WizardStep) => void;
}
