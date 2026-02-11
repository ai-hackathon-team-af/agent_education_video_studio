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

  updateSegment: (sectionIndex: number, segmentIndex: number, updates: Partial<import("@/types").ConversationSegment>) => {
    const { generatedScript } = get();
    if (!generatedScript) return;

    const newSections = generatedScript.sections.map((section, si) => {
      if (si !== sectionIndex) return section;
      return {
        ...section,
        segments: section.segments.map((seg, sgi) => {
          if (sgi !== segmentIndex) return seg;
          const updated = { ...seg, ...updates };
          // text変更時はtext_for_voicevoxも同期
          if (updates.text !== undefined && !updates.text_for_voicevox) {
            updated.text_for_voicevox = updates.text;
          }
          // speaker変更時はvisible_charactersとcharacter_expressionsも同期
          if (updates.speaker !== undefined) {
            const newSpeaker = updates.speaker;
            const expression = updated.expression || "normal";
            // visible_charactersに新しい話者を含める（デュオ: 話者 + もう1人）
            const otherChar = newSpeaker === "zundamon" ? "metan" : "zundamon";
            updated.visible_characters = [newSpeaker, otherChar];
            // character_expressionsを更新
            updated.character_expressions = {
              [newSpeaker]: expression,
              [otherChar]: updated.character_expressions?.[otherChar] || "normal",
            };
          }
          // expression変更時はcharacter_expressionsも同期
          if (updates.expression !== undefined && updated.character_expressions) {
            updated.character_expressions = {
              ...updated.character_expressions,
              [updated.speaker]: updates.expression,
            };
          }
          return updated;
        }),
      };
    });

    set({
      generatedScript: {
        ...generatedScript,
        sections: newSections,
        all_segments: newSections.flatMap((s) => s.segments),
      },
    });
  },

  addSegment: (sectionIndex: number, afterSegmentIndex: number) => {
    const { generatedScript } = get();
    if (!generatedScript) return;

    const newSegment: import("@/types").ConversationSegment = {
      speaker: "zundamon",
      text: "",
      text_for_voicevox: "",
      expression: "normal",
      visible_characters: ["zundamon", "metan"],
      character_expressions: { zundamon: "normal", metan: "normal" },
    };

    const newSections = generatedScript.sections.map((section, si) => {
      if (si !== sectionIndex) return section;
      const newSegments = [...section.segments];
      newSegments.splice(afterSegmentIndex + 1, 0, newSegment);
      return { ...section, segments: newSegments };
    });

    set({
      generatedScript: {
        ...generatedScript,
        sections: newSections,
        all_segments: newSections.flatMap((s) => s.segments),
      },
    });
  },

  deleteSegment: (sectionIndex: number, segmentIndex: number) => {
    const { generatedScript } = get();
    if (!generatedScript) return;

    const section = generatedScript.sections[sectionIndex];
    if (!section || section.segments.length <= 1) return;

    const newSections = generatedScript.sections.map((s, si) => {
      if (si !== sectionIndex) return s;
      return {
        ...s,
        segments: s.segments.filter((_, sgi) => sgi !== segmentIndex),
      };
    });

    set({
      generatedScript: {
        ...generatedScript,
        sections: newSections,
        all_segments: newSections.flatMap((s) => s.segments),
      },
    });
  },

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
        theme: generatedScript.theme,
        script_data: generatedScript as unknown as Record<string, unknown>,
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
