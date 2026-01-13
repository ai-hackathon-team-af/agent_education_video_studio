import { apiClient } from "./client";

export interface ExtractedTextResponse {
  filename: string;
  text: string;
  file_type: string;
  success: boolean;
  message: string;
}

export const uploadApi = {
  /**
   * ファイルからテキストを抽出
   */
  extractText: async (file: File): Promise<ExtractedTextResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<ExtractedTextResponse>(
      "/upload/extract-text",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  },
};
