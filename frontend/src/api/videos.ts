import apiClient from "./client";
import type {
  VideoGenerationRequest,
  VideoGenerationResponse,
  VideoStatusResponse,
  JsonFileInfo,
  JsonFileStatusUpdate,
  JsonScriptData,
} from "@/types";

export const videoApi = {
  /**
   * JSONファイル一覧を取得
   */
  listJsonFiles: async (): Promise<JsonFileInfo[]> => {
    const response = await apiClient.get<JsonFileInfo[]>("/videos/json-files");
    return response.data;
  },

  /**
   * JSONファイルの内容を取得
   */
  getJsonFile: async (filename: string): Promise<JsonScriptData> => {
    const response = await apiClient.get<JsonScriptData>(
      `/videos/json-files/${encodeURIComponent(filename)}`
    );
    return response.data;
  },

  /**
   * 動画を生成
   */
  generateVideo: async (
    request: VideoGenerationRequest
  ): Promise<VideoGenerationResponse> => {
    const response = await apiClient.post<VideoGenerationResponse>(
      "/videos/generate",
      request
    );
    return response.data;
  },

  /**
   * 動画生成ステータスを取得
   */
  getVideoStatus: async (taskId: string): Promise<VideoStatusResponse> => {
    const response = await apiClient.get<VideoStatusResponse>(
      `/videos/status/${taskId}`
    );
    return response.data;
  },

  /**
   * JSONファイルのステータスを更新
   */
  updateJsonFileStatus: async (
    filename: string,
    status: JsonFileStatusUpdate
  ): Promise<JsonFileInfo> => {
    const response = await apiClient.patch<JsonFileInfo>(
      `/videos/json-files/${encodeURIComponent(filename)}/status`,
      status
    );
    return response.data;
  },

  /**
   * JSONファイルを削除
   */
  deleteJsonFile: async (
    filename: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(
      `/videos/json-files/${encodeURIComponent(filename)}`
    );
    return response.data;
  },

  /**
   * ヘルスチェック
   */
  healthCheck: async (): Promise<{ status: string; service: string }> => {
    const response = await apiClient.get("/videos/health");
    return response.data;
  },
};
