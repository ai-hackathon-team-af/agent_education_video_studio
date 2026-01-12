import { create } from "zustand";
import type {
  JsonFileInfo,
  JsonScriptData,
  VideoStatusResponse,
} from "@/types";
import { videoApi } from "@/api/videos";

export type VideoGenerationStatus =
  | "idle"
  | "pending"
  | "processing"
  | "completed"
  | "failed";

interface VideoState {
  // JSONファイル一覧
  jsonFiles: JsonFileInfo[];
  isLoadingFiles: boolean;

  // 選択中のファイル
  selectedFilename: string | null;
  selectedFileData: JsonScriptData | null;
  isLoadingFileData: boolean;

  // 動画生成状態
  taskId: string | null;
  generationStatus: VideoGenerationStatus;
  progress: number;
  statusMessage: string;
  error: string | null;
  videoPath: string | null;

  // アクション
  loadJsonFiles: () => Promise<void>;
  selectFile: (filename: string | null) => Promise<void>;
  generateVideo: () => Promise<void>;
  checkStatus: () => Promise<void>;
  pollStatus: () => void;
  deleteFile: (filename: string) => Promise<void>;
  reset: () => void;
  clearError: () => void;
}

// ポーリング間隔
const POLL_INTERVAL = 2000;

export const useVideoStore = create<VideoState>((set, get) => ({
  // 初期状態
  jsonFiles: [],
  isLoadingFiles: false,

  selectedFilename: null,
  selectedFileData: null,
  isLoadingFileData: false,

  taskId: null,
  generationStatus: "idle",
  progress: 0,
  statusMessage: "",
  error: null,
  videoPath: null,

  // JSONファイル一覧を読み込み
  loadJsonFiles: async () => {
    set({ isLoadingFiles: true, error: null });
    try {
      const files = await videoApi.listJsonFiles();
      set({ jsonFiles: files, isLoadingFiles: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "ファイル一覧の取得に失敗しました",
        isLoadingFiles: false,
      });
    }
  },

  // ファイルを選択
  selectFile: async (filename: string | null) => {
    if (!filename) {
      set({
        selectedFilename: null,
        selectedFileData: null,
        generationStatus: "idle",
        taskId: null,
        progress: 0,
        statusMessage: "",
        videoPath: null,
      });
      return;
    }

    set({ selectedFilename: filename, isLoadingFileData: true, error: null });
    try {
      const data = await videoApi.getJsonFile(filename);
      set({
        selectedFileData: data,
        isLoadingFileData: false,
        generationStatus: "idle",
        taskId: null,
        progress: 0,
        statusMessage: "",
        videoPath: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "ファイルの読み込みに失敗しました",
        isLoadingFileData: false,
        selectedFileData: null,
      });
    }
  },

  // 動画を生成
  generateVideo: async () => {
    const { selectedFileData, selectedFilename } = get();
    if (!selectedFileData || !selectedFilename) {
      set({ error: "ファイルが選択されていません" });
      return;
    }

    set({
      generationStatus: "pending",
      progress: 0,
      statusMessage: "動画生成を開始しています...",
      error: null,
      videoPath: null,
    });

    try {
      // セクションからconversationsを構築
      const conversations = selectedFileData.sections.flatMap((section) =>
        section.segments.map((segment) => ({
          speaker: segment.speaker,
          text: segment.text,
          text_for_voicevox: segment.text_for_voicevox,
          expression: segment.expression,
          background: section.scene_background,
          visible_characters: segment.visible_characters,
          character_expressions: segment.character_expressions,
        }))
      );

      const response = await videoApi.generateVideo({
        conversations,
        enable_subtitles: true,
        conversation_mode: "duo",
        sections: selectedFileData.sections,
      });

      set({
        taskId: response.task_id,
        generationStatus: "processing",
        statusMessage: response.message,
      });

      // ステータスポーリング開始
      get().pollStatus();
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "動画生成の開始に失敗しました",
        generationStatus: "failed",
      });
    }
  },

  // ステータスを確認
  checkStatus: async () => {
    const { taskId } = get();
    if (!taskId) return;

    try {
      const status = await videoApi.getVideoStatus(taskId);
      handleStatusUpdate(set, get, status);
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "ステータスの取得に失敗しました",
        generationStatus: "failed",
      });
    }
  },

  // ステータスポーリング
  pollStatus: () => {
    const checkAndPoll = async () => {
      const state = get();
      if (
        state.generationStatus !== "processing" &&
        state.generationStatus !== "pending"
      ) {
        return;
      }

      await state.checkStatus();

      const newState = get();
      if (
        newState.generationStatus === "processing" ||
        newState.generationStatus === "pending"
      ) {
        setTimeout(checkAndPoll, POLL_INTERVAL);
      }
    };

    checkAndPoll();
  },

  // ファイルを削除
  deleteFile: async (filename: string) => {
    try {
      await videoApi.deleteJsonFile(filename);
      const { selectedFilename } = get();
      if (selectedFilename === filename) {
        set({
          selectedFilename: null,
          selectedFileData: null,
        });
      }
      await get().loadJsonFiles();
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "ファイルの削除に失敗しました",
      });
    }
  },

  // リセット
  reset: () => {
    set({
      selectedFilename: null,
      selectedFileData: null,
      taskId: null,
      generationStatus: "idle",
      progress: 0,
      statusMessage: "",
      error: null,
      videoPath: null,
    });
  },

  // エラーをクリア
  clearError: () => {
    set({ error: null });
  },
}));

// ステータス更新を処理
function handleStatusUpdate(
  set: (state: Partial<VideoState>) => void,
  get: () => VideoState,
  status: VideoStatusResponse
) {
  const newState: Partial<VideoState> = {
    progress: status.progress,
    statusMessage: status.message || "",
  };

  switch (status.status) {
    case "pending":
      newState.generationStatus = "pending";
      break;
    case "processing":
      newState.generationStatus = "processing";
      break;
    case "completed":
      newState.generationStatus = "completed";
      newState.videoPath = status.result?.video_path || null;
      // ファイルのis_generatedを更新
      updateFileGeneratedStatus(get().selectedFilename);
      break;
    case "failed":
      newState.generationStatus = "failed";
      newState.error = status.error || "動画生成に失敗しました";
      break;
  }

  set(newState);
}

// ファイルの生成済みステータスを更新
async function updateFileGeneratedStatus(filename: string | null) {
  if (!filename) return;
  try {
    await videoApi.updateJsonFileStatus(filename, { is_generated: true });
  } catch (error) {
    console.error("Failed to update file status:", error);
  }
}
