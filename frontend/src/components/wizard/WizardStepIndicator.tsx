import { CheckCircle } from "lucide-react";
import type { WizardStep } from "@/types/wizard";

interface WizardStepIndicatorProps {
  currentStep: WizardStep;
}

const WizardStepIndicator = ({ currentStep }: WizardStepIndicatorProps) => {
  return (
    <div className="hidden md:flex items-center gap-4">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
              currentStep === s
                ? "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-50"
                : currentStep > s
                ? "bg-green-500 border-green-500 text-white"
                : "bg-white border-slate-200 text-slate-400"
            }`}
          >
            {currentStep > s ? <CheckCircle size={16} /> : s}
          </div>
          {s < 4 && (
            <div
              className={`w-8 h-0.5 ${
                currentStep > s ? "bg-green-500" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default WizardStepIndicator;
