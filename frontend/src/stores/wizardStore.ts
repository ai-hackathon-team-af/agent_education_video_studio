import { create } from "zustand";
import type {
  WizardStep,
  WizardState,
  WizardActions,
  Grade,
  Subject,
  GeneratedScript,
} from "@/types/wizard";

// 初期状態
const initialState: WizardState = {
  step: 1,

  // InputScreen
  fileName: "",
  fileContent: "",
  grade: "中学3年生",
  subject: "理科",

  // ReviewScreen
  originalText: "",
  generatedScript: null,

  // LoadingScreen
  loadingLogs: [],
  progress: 0,
  taskId: null,

  // ResultScreen
  videoPath: null,

  // 共通
  isProcessing: false,
  error: null,
};

export const useWizardStore = create<WizardState & WizardActions>((set, get) => ({
  ...initialState,

  // === ステップ操作 ===
  setStep: (step: WizardStep) => set({ step }),

  goToNextStep: () => {
    const { step } = get();
    if (step < 4) {
      set({ step: (step + 1) as WizardStep });
    }
  },

  goToPrevStep: () => {
    const { step } = get();
    if (step > 1) {
      set({ step: (step - 1) as WizardStep });
    }
  },

  // === InputScreen ===
  setFileName: (name: string) => set({ fileName: name }),

  setFileContent: (content: string) => set({ fileContent: content }),

  setGrade: (grade: Grade) => set({ grade }),

  setSubject: (subject: Subject) => set({ subject }),

  // === ReviewScreen ===
  setOriginalText: (text: string) => set({ originalText: text }),

  setGeneratedScript: (script: GeneratedScript | null) =>
    set({ generatedScript: script }),

  // === LoadingScreen ===
  addLoadingLog: (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    set((state) => ({
      loadingLogs: [...state.loadingLogs, { timestamp, message }],
    }));
  },

  clearLoadingLogs: () => set({ loadingLogs: [] }),

  setProgress: (progress: number) => set({ progress }),

  setTaskId: (taskId: string | null) => set({ taskId }),

  // === ResultScreen ===
  setVideoPath: (path: string | null) => set({ videoPath: path }),

  // === 共通 ===
  setIsProcessing: (isProcessing: boolean) => set({ isProcessing }),

  setError: (error: string | null) => set({ error }),

  // === リセット ===
  reset: () => set(initialState),

  resetToStep: (step: WizardStep) => {
    const resetState: Partial<WizardState> = { step, error: null };

    // ステップに応じて後続のデータをクリア
    if (step <= 1) {
      resetState.generatedScript = null;
      resetState.loadingLogs = [];
      resetState.progress = 0;
      resetState.taskId = null;
      resetState.videoPath = null;
    } else if (step <= 2) {
      resetState.loadingLogs = [];
      resetState.progress = 0;
      resetState.taskId = null;
      resetState.videoPath = null;
    } else if (step <= 3) {
      resetState.videoPath = null;
    }

    set(resetState);
  },
}));
