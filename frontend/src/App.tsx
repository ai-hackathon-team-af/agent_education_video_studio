import { useEffect } from "react";
import Layout from "./components/Layout";
import Toaster from "./components/Toast";
import ScriptGenerationPage from "./pages/ScriptGenerationPage";
import { useScriptStore } from "./stores/scriptStore";

function App() {
  const loadModels = useScriptStore((state) => state.loadModels);

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
      <ScriptGenerationPage />
      <Toaster />
    </Layout>
  );
}

export default App;
