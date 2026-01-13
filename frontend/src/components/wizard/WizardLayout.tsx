import { Cpu } from "lucide-react";
import type { WizardStep } from "@/types/wizard";
import WizardStepIndicator from "./WizardStepIndicator";

interface WizardLayoutProps {
  currentStep: WizardStep;
  children: React.ReactNode;
}

const WizardLayout = ({ currentStep, children }: WizardLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Navigation Header */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
              <Cpu className="text-white" size={20} />
            </div>
            <span className="font-black text-xl tracking-tight text-slate-800">
              AI Teacher's Assistant
            </span>
          </div>

          <WizardStepIndicator currentStep={currentStep} />
        </div>
      </nav>

      <main className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </main>
    </div>
  );
};

export default WizardLayout;
