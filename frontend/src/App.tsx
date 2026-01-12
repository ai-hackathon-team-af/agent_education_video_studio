import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import Toaster from "./components/Toast";
import ScriptGenerationPage from "./pages/ScriptGenerationPage";
import VideoGenerationPage from "./pages/VideoGenerationPage";
import { useScriptStore } from "./stores/scriptStore";
import { FileText, Film } from "lucide-react";

type TabType = "script" | "video";

function App() {
  const loadModels = useScriptStore((state) => state.loadModels);
  const [activeTab, setActiveTab] = useState<TabType>("script");

  useEffect(() => {
    // Initialize dark mode from localStorage
    const theme = localStorage.getItem("theme");
    if (
      theme === "dark" ||
      (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
    }

    // Load available models from API
    loadModels();
  }, [loadModels]);

  return (
    <Layout>
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("script")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "script"
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <FileText className="h-4 w-4" />
            台本生成
          </button>
          <button
            onClick={() => setActiveTab("video")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "video"
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <Film className="h-4 w-4" />
            動画生成
          </button>
        </nav>
      </div>

      {/* Page Content */}
      {activeTab === "script" ? <ScriptGenerationPage /> : <VideoGenerationPage />}
      <Toaster />
    </Layout>
  );
}

export default App;
