import { useWizardStore } from "@/stores/wizardStore";
import {
  WizardLayout,
  InputScreen,
  ReviewScreen,
  LoadingScreen,
  ResultScreen,
} from "@/components/wizard";

const WizardPage = () => {
  const step = useWizardStore((state) => state.step);

  return (
    <WizardLayout currentStep={step}>
      {step === 1 && <InputScreen />}
      {step === 2 && <ReviewScreen />}
      {step === 3 && <LoadingScreen />}
      {step === 4 && <ResultScreen />}
    </WizardLayout>
  );
};

export default WizardPage;
