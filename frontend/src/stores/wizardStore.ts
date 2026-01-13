import { create } from "zustand";
import type { ComedyScript } from "@/types";
import type {
  WizardStep,
  WizardState,
  WizardActions,
  Grade,
  Subject,
  AIOptimization,
} from "@/types/wizard";
import { uploadApi } from "@/api/upload";
import { scriptApi } from "@/api/scripts";
import { videoApi } from "@/api/videos";

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
  aiOptimizations: [],

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

  uploadFile: async (file: File) => {
    set({ isProcessing: true, error: null });
    try {
      const result = await uploadApi.extractText(file);
      if (result.success) {
        set({
          fileName: result.filename,
          fileContent: result.text,
          originalText: result.text,
          isProcessing: false,
        });
      } else {
        set({
          error: result.message,
          isProcessing: false,
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "ファイルの処理に失敗しました",
        isProcessing: false,
      });
    }
  },

  // === ReviewScreen ===
  setOriginalText: (text: string) => set({ originalText: text }),

  setGeneratedScript: (script: ComedyScript | null) =>
    set({ generatedScript: script }),

  generateScript: async () => {
    const { originalText, grade, subject } = get();
    set({ isProcessing: true, error: null });

    try {
      // 台本生成APIを呼び出し
      const inputText = `【${grade}】【${subject}】\n\n${originalText}`;
      const response = await scriptApi.generateFullScript({
        mode: "comedy",
        input_text: inputText,
      });

      set({
        generatedScript: response.script,
        isProcessing: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "台本の生成に失敗しました",
        isProcessing: false,
      });
    }
  },

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

  startVideoGeneration: async () => {
    const { generatedScript, addLoadingLog, clearLoadingLogs, setProgress, setTaskId } = get();

    if (!generatedScript) {
      set({ error: "台本がありません" });
      return;
    }

    clearLoadingLogs();
    setProgress(0);
    set({ isProcessing: true, error: null });

    addLoadingLog("動画生成を開始しています...");

    try {
      // 動画生成APIを呼び出し
      const response = await videoApi.generateVideo({
        conversations: generatedScript.all_segments,
        sections: generatedScript.sections,
        enable_subtitles: true,
        conversation_mode: "duo",
      });

      setTaskId(response.task_id);
      addLoadingLog(`タスクID: ${response.task_id}`);
      addLoadingLog("音声合成を開始しています...");

      // ポーリング開始
      get().pollVideoStatus();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "動画生成の開始に失敗しました",
        isProcessing: false,
      });
    }
  },

  pollVideoStatus: async () => {
    const { taskId, addLoadingLog, setProgress, setStep, setVideoPath, setAiOptimizations } = get();

    if (!taskId) return;

    const poll = async () => {
      try {
        const status = await videoApi.getVideoStatus(taskId);

        // 進捗更新
        setProgress(status.progress * 100);

        // ステータスに応じたログ追加
        if (status.message) {
          addLoadingLog(status.message);
        }

        if (status.status === "completed") {
          addLoadingLog("動画生成が完了しました！");

          // 動画パスを設定
          if (status.result?.video_path) {
            setVideoPath(status.result.video_path);
          }

          // AIの最適化ポイントをダミーで設定（実際はAPIから取得）
          setAiOptimizations([
            {
              type: "understanding_hook",
              title: "専門用語の平易化",
              description: "難しい用語を日常的な言葉で言い換えて理解を促進します。",
            },
            {
              type: "visual_effect",
              title: "身近な例での図解",
              description: "日常生活の例を使って視覚的に説明します。",
            },
          ]);

          set({ isProcessing: false });
          setStep(4);
          return;
        }

        if (status.status === "failed") {
          addLoadingLog(`エラー: ${status.error || "不明なエラー"}`);
          set({
            error: status.error || "動画生成に失敗しました",
            isProcessing: false,
          });
          return;
        }

        // 処理中の場合は2秒後に再度ポーリング
        setTimeout(poll, 2000);
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : "ステータスの取得に失敗しました",
          isProcessing: false,
        });
      }
    };

    poll();
  },

  // === ResultScreen ===
  setVideoPath: (path: string | null) => set({ videoPath: path }),

  setAiOptimizations: (optimizations: AIOptimization[]) =>
    set({ aiOptimizations: optimizations }),

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
      resetState.aiOptimizations = [];
    } else if (step <= 2) {
      resetState.loadingLogs = [];
      resetState.progress = 0;
      resetState.taskId = null;
      resetState.videoPath = null;
      resetState.aiOptimizations = [];
    } else if (step <= 3) {
      resetState.videoPath = null;
      resetState.aiOptimizations = [];
    }

    set(resetState);
  },
}));
