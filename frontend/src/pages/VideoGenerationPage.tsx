import { useEffect } from "react";
import { useVideoStore } from "@/stores/videoStore";
import Card from "@/components/Card";
import Button from "@/components/Button";
import ProgressBar from "@/components/ProgressBar";
import Badge from "@/components/Badge";
import {
  FileVideo,
  Play,
  Trash2,
  RefreshCw,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Film,
} from "lucide-react";

// 動画パスからURLを生成
const getVideoUrl = (videoPath: string): string => {
  // 絶対パスの場合はファイル名のみを抽出
  const filename = videoPath.includes("/") || videoPath.includes("\\")
    ? videoPath.split(/[/\\]/).pop() || videoPath
    : videoPath;
  return `/outputs/${filename}`;
};

const VideoGenerationPage = () => {
  const {
    jsonFiles,
    isLoadingFiles,
    selectedFilename,
    selectedFileData,
    isLoadingFileData,
    generationStatus,
    progress,
    statusMessage,
    error,
    videoPath,
    loadJsonFiles,
    selectFile,
    generateVideo,
    deleteFile,
    clearError,
  } = useVideoStore();

  useEffect(() => {
    loadJsonFiles();
  }, [loadJsonFiles]);

  const handleDelete = async (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`「${filename}」を削除しますか?`)) {
      await deleteFile(filename);
    }
  };

  const isGenerating =
    generationStatus === "pending" || generationStatus === "processing";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Film className="h-8 w-8 text-primary-500" />
          動画生成
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          保存した台本から動画を生成します
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
          >
            &times;
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ファイル一覧 */}
        <div className="lg:col-span-1">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                台本ファイル
              </h2>
              <button
                onClick={() => loadJsonFiles()}
                disabled={isLoadingFiles}
                className="p-2 text-gray-500 hover:text-primary-500 transition-colors disabled:opacity-50"
                title="更新"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoadingFiles ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            {isLoadingFiles ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                読み込み中...
              </div>
            ) : jsonFiles.length === 0 ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                <FileVideo className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>台本ファイルがありません</p>
                <p className="text-sm mt-1">
                  台本生成ページで台本を作成・保存してください
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {jsonFiles.map((file) => (
                  <div
                    key={file.filename}
                    onClick={() => selectFile(file.filename)}
                    className={`p-3 rounded-lg cursor-pointer transition-all border ${
                      selectedFilename === file.filename
                        ? "bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700"
                        : "bg-gray-50 dark:bg-gray-800 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                          {file.filename}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {file.is_generated ? (
                            <Badge variant="success" size="sm">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              生成済み
                            </Badge>
                          ) : (
                            <Badge variant="default" size="sm">
                              <Clock className="h-3 w-3 mr-1" />
                              未生成
                            </Badge>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDelete(file.filename, e)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* 詳細・生成パネル */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedFilename ? (
            <Card>
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                <FileVideo className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">ファイルを選択してください</p>
                <p className="text-sm mt-1">
                  左のリストから台本ファイルを選択すると、詳細が表示されます
                </p>
              </div>
            </Card>
          ) : isLoadingFileData ? (
            <Card>
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                読み込み中...
              </div>
            </Card>
          ) : selectedFileData ? (
            <>
              {/* ファイル情報 */}
              <Card>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {selectedFileData.title}
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      モード
                    </span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedFileData.mode === "comedy"
                        ? "お笑い漫談"
                        : selectedFileData.mode}
                    </p>
                  </div>
                  {selectedFileData.estimated_duration && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        推定時間
                      </span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedFileData.estimated_duration}
                      </p>
                    </div>
                  )}
                  {selectedFileData.theme && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        テーマ
                      </span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedFileData.theme}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      セクション数
                    </span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedFileData.sections?.length || 0}
                    </p>
                  </div>
                </div>

                {/* セクション一覧 */}
                {selectedFileData.sections &&
                  selectedFileData.sections.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        セクション構成
                      </h3>
                      <div className="space-y-1">
                        {selectedFileData.sections.map((section, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-sm py-1 px-2 bg-gray-50 dark:bg-gray-800 rounded"
                          >
                            <span className="text-gray-700 dark:text-gray-300">
                              {section.section_name}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {section.segments?.length || 0} 行
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </Card>

              {/* 生成コントロール */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  動画生成
                </h3>

                {isGenerating && (
                  <div className="mb-4">
                    <ProgressBar
                      progress={progress * 100}
                      message={statusMessage}
                      variant="default"
                    />
                  </div>
                )}

                {generationStatus === "completed" && (
                  <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">動画の生成が完了しました</span>
                    </div>
                    {videoPath && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        出力先: {videoPath}
                      </p>
                    )}
                  </div>
                )}

                {generationStatus === "failed" && (
                  <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">動画の生成に失敗しました</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={generateVideo}
                    disabled={isGenerating}
                    variant="primary"
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5" />
                        動画を生成
                      </>
                    )}
                  </Button>

                  {generationStatus === "completed" && videoPath && (
                    <a
                      href={getVideoUrl(videoPath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Download className="h-5 w-5" />
                      動画を開く
                    </a>
                  )}
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  動画生成には数分かかる場合があります。
                  VOICEVOXが起動している必要があります。
                </p>
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default VideoGenerationPage;
